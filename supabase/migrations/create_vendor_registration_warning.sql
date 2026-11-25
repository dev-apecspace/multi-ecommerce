CREATE TABLE IF NOT EXISTS "VendorRegistrationWarning" (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  "minReadSeconds" INTEGER NOT NULL DEFAULT 20 CHECK ("minReadSeconds" BETWEEN 0 AND 600),
  "updatedBy" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "VendorRegistrationWarning" (id, title, content, version, "minReadSeconds")
VALUES (
  1,
  'Cảnh báo quy định dành cho nhà bán hàng',
  E'Nhằm xây dựng môi trường kinh doanh minh bạch, an toàn và tuân thủ pháp luật, Nhà bán hàng có trách nhiệm cung cấp thông tin trung thực và tuân thủ các quy định của Nền tảng.\n\n1. Quy định về tài khoản Nhà bán hàng không được:\n• Mạo danh hoặc sử dụng thông tin, giấy tờ của cá nhân, tổ chức khác;\n• Cung cấp thông tin sai lệch về chủ thể kinh doanh, địa chỉ, mã số thuế hoặc giấy phép;\n• Tạo tài khoản giả, nhiều tài khoản để gian lận, trục lợi khuyến mại hoặc thao túng thứ hạng;\n• Cho thuê, mua bán, chuyển nhượng hoặc chia sẻ tài khoản trái quy định.\n\n2. Quy định trong quá trình kinh doanh Nghiêm cấm:\n• Tạo đơn hàng, đánh giá, lượt mua hoặc tương tác giả;\n• Gian lận giá, khuyến mại hoặc thao túng kết quả hiển thị;\n• Thu thập, sử dụng hoặc tiết lộ thông tin Người mua trái quy định;\n• Can thiệp, phá hoại hoặc gây mất an toàn cho hệ thống Nền tảng.\n\n3. Quy định về hàng hóa, dịch vụ Nhà bán hàng phải có giấy phép kinh doanh phù hợp đối với hoạt động kinh doanh có điều kiện, chỉ được cung cấp hàng hóa, dịch vụ hợp pháp, có nguồn gốc rõ ràng và thông tin chính xác. Nghiêm cấm kinh doanh hàng giả, hàng cấm, hàng xâm phạm quyền sở hữu trí tuệ hoặc cung cấp thông tin sai lệch về nguồn gốc, chất lượng, chứng nhận, giá và các đặc tính của sản phẩm.\n\n4. Kiểm tra và xử lý vi phạm Nền tảng có quyền kiểm tra, xác minh và áp dụng các biện pháp phù hợp đối với tài khoản, gian hàng hoặc sản phẩm có dấu hiệu vi phạm, bao gồm yêu cầu giải trình, gỡ bỏ nội dung, ẩn sản phẩm, hạn chế chức năng, tạm khóa hoặc chấm dứt tài khoản. Đối với giao dịch có dấu hiệu gian lận hoặc vi phạm, Nền tảng có thể tạm thời hạn chế việc thanh toán các khoản tiền liên quan trong phạm vi cần thiết để xác minh và xử lý theo quy định. Trường hợp vụ việc có dấu hiệu vi phạm pháp luật, Nền tảng có thể phối hợp và cung cấp thông tin cho cơ quan nhà nước có thẩm quyền để xử lý theo quy định pháp luật. Nhà bán hàng chịu trách nhiệm về tính hợp pháp của tài khoản, hàng hóa, dịch vụ và mọi hoạt động do mình thực hiện trên Nền tảng.',
  1,
  20
)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS "VendorWarningAcceptance" (
  id BIGSERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  "vendorId" INTEGER REFERENCES "Vendor"(id) ON DELETE SET NULL,
  "userName" TEXT NOT NULL,
  email TEXT NOT NULL,
  "shopName" TEXT NOT NULL,
  "warningVersion" INTEGER NOT NULL,
  "warningTitle" TEXT NOT NULL,
  "warningContent" TEXT NOT NULL,
  "acceptedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "VendorWarningAcceptance_acceptedAt_idx" ON "VendorWarningAcceptance"("acceptedAt" DESC);
CREATE INDEX IF NOT EXISTS "VendorWarningAcceptance_userId_idx" ON "VendorWarningAcceptance"("userId");
CREATE INDEX IF NOT EXISTS "VendorWarningAcceptance_vendorId_idx" ON "VendorWarningAcceptance"("vendorId");
