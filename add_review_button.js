const fs = require('fs');

const filePath = 'app/client/order-history/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Find the completed orders section and add review button
const completedOrderItemPattern = /({order\.OrderItem\.map\(\(item, idx\) => {[\s\S]*?{isReturnable\(order\)[\s\S]*?}\s*\)[\s\S]*?}\)[\s\S]*?<div className="flex items-center justify-between pt-4 border-t">/;

if (!content.includes('Review sản phẩm')) {
  // Find location after the completed orders mapping, add a review button
  const completedSectionStart = content.indexOf('TabsContent value="completed"');
  const completedFirstItem = content.indexOf('completedOrders.map((order) => {', completedSectionStart);
  const completedFirstItemEnd = content.indexOf('{order.OrderItem.map((item, idx) => {', completedFirstItem);
  
  if (completedFirstItem !== -1 && completedFirstItemEnd !== -1) {
    // Find where to add review button - after the order item display, before vendor info
    const vendorDivPattern = 'className="flex items-center justify-between pt-4 border-t"';
    const vendorDivIndex = content.indexOf(vendorDivPattern, completedFirstItemEnd);
    
    if (vendorDivIndex !== -1) {
      const beforeVendor = content.substring(0, vendorDivIndex);
      const afterVendor = content.substring(vendorDivIndex);
      
      // Add review button before the vendor section in completed orders
      const reviewButton = `{order.OrderItem.map((item2, idx2) => (
                            <Button
                              key={idx2}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => setReviewModal({
                                open: true,
                                productId: item2.Product.id,
                                productName: item2.Product.name,
                                orderId: order.id
                              })}
                            >
                              <Star className="h-4 w-4 mr-1" />
                              Đánh giá
                            </Button>
                          ))}
                    </div>
                    <`;
      
      // Actually, let's place it more carefully - find the last closing div before vendor section
      const lastClosingDivBeforeVendor = beforeVendor.lastIndexOf('</div>');
      if (lastClosingDivBeforeVendor !== -1) {
        const beforeClosing = beforeVendor.substring(0, lastClosingDivBeforeVendor);
        const reviewSection = `
                            <div className="flex gap-2 flex-wrap">
                              {order.OrderItem.map((item2, idx2) => (
                                <Button
                                  key={idx2}
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => setReviewModal({
                                    open: true,
                                    productId: item2.Product.id,
                                    productName: item2.Product.name,
                                    orderId: order.id
                                  })}
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Đánh giá
                                </Button>
                              ))}
                            </div>
                          </div>
                    <`;
        
        content = beforeClosing + reviewSection + afterVendor;
      }
    }
  }
}

// Add ReviewModal component before closing main tag
if (!content.includes('<ReviewModal')) {
  const mainEndIndex = content.lastIndexOf('</main>');
  if (mainEndIndex !== -1) {
    const reviewModalComponent = `
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        productId={reviewModal.productId || 0}
        productName={reviewModal.productName}
        orderId={reviewModal.orderId || 0}
        onReviewSubmitted={() => {
          fetchOrders();
        }}
      />
    `;
    
    content = content.substring(0, mainEndIndex) + reviewModalComponent + content.substring(mainEndIndex);
  }
}

fs.writeFileSync(filePath, content);
console.log('Added review button and modal');
