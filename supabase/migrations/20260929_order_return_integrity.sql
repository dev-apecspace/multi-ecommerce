-- Apply before deploying the matching order/return API changes.
BEGIN;

-- Stock changes and status changes commit or roll back together.
CREATE OR REPLACE FUNCTION public.restore_cancelled_order_stock()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE item RECORD;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    IF OLD.status NOT IN ('pending', 'processing') THEN
      RAISE EXCEPTION 'Only pending or processing orders can be cancelled';
    END IF;
    FOR item IN SELECT * FROM "OrderItem" WHERE "orderId" = NEW.id ORDER BY id LOOP
      IF item."variantId" IS NOT NULL THEN
        UPDATE "ProductVariant" SET stock = COALESCE(stock, 0) + item.quantity WHERE id = item."variantId";
      ELSE
        UPDATE "Product" SET stock = COALESCE(stock, 0) + item.quantity WHERE id = item."productId";
      END IF;
      IF NOT FOUND THEN RAISE EXCEPTION 'Cannot restore stock for order item %', item.id; END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS restore_cancelled_order_stock ON public."Order";
CREATE TRIGGER restore_cancelled_order_stock AFTER UPDATE OF status ON public."Order"
FOR EACH ROW EXECUTE FUNCTION public.restore_cancelled_order_stock();

-- Serialize competing return requests for the same order item.
CREATE OR REPLACE FUNCTION public.validate_new_return()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE item RECORD; purchase RECORD;
BEGIN
  SELECT * INTO purchase FROM "Order" WHERE id = NEW."orderId" FOR UPDATE;
  IF NOT FOUND OR purchase."userId" <> NEW."userId" OR purchase.status <> 'delivered' THEN
    RAISE EXCEPTION 'Only your delivered orders can be returned';
  END IF;
  IF purchase."updatedAt" IS NULL OR purchase."updatedAt" < CURRENT_TIMESTAMP - INTERVAL '3 days' THEN
    RAISE EXCEPTION 'Return period expired';
  END IF;
  SELECT * INTO item FROM "OrderItem" WHERE id = NEW."orderItemId" FOR UPDATE;
  IF NOT FOUND OR item."orderId" <> NEW."orderId" OR item."productId" <> NEW."productId"
    OR item."vendorId" <> NEW."vendorId" OR item."variantId" IS DISTINCT FROM NEW."variantId" THEN
    RAISE EXCEPTION 'Return item does not match the order';
  END IF;
  IF NEW.quantity IS NULL OR NEW.quantity < 1 OR NEW.quantity > item.quantity THEN
    RAISE EXCEPTION 'Invalid return quantity';
  END IF;
  IF EXISTS (SELECT 1 FROM "Return" WHERE "orderItemId" = NEW."orderItemId" AND status NOT IN ('cancelled', 'rejected')) THEN
    RAISE EXCEPTION 'Return request already exists for this item';
  END IF;
  NEW."refundAmount" := item.price * NEW.quantity;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_new_return ON public."Return";
CREATE TRIGGER validate_new_return BEFORE INSERT ON public."Return"
FOR EACH ROW EXECUTE FUNCTION public.validate_new_return();

CREATE OR REPLACE FUNCTION public.restock_return_items()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW."returnType" = 'return' AND NEW.status = 'restocked' AND OLD.status <> 'restocked' THEN
    IF OLD.status <> 'received' THEN RAISE EXCEPTION 'Only received returns can be restocked'; END IF;
    IF NEW."variantId" IS NOT NULL THEN
      UPDATE "ProductVariant" SET stock = COALESCE(stock, 0) + NEW.quantity WHERE id = NEW."variantId";
    ELSE
      UPDATE "Product" SET stock = COALESCE(stock, 0) + NEW.quantity WHERE id = NEW."productId";
    END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cannot restore stock for return %', NEW.id; END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS restock_return_items ON public."Return";
CREATE TRIGGER restock_return_items AFTER UPDATE OF status ON public."Return"
FOR EACH ROW EXECUTE FUNCTION public.restock_return_items();
COMMIT;
