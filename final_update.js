const fs = require('fs');
const path = require('path');

const filePath = 'app/client/order-history/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Add ReviewModal component before </main>
if (!content.includes('<ReviewModal')) {
  const reviewModalCode = `
      <ReviewModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ ...reviewModal, open: false })}
        productId={reviewModal.productId || 0}
        productName={reviewModal.productName}
        orderId={reviewModal.orderId || 0}
        onReviewSubmitted={() => {
          fetchOrders();
        }}
      />`;

  content = content.replace('    </main>', reviewModalCode + '\n    </main>');
}

// Add review button in completed orders - find the pattern and add button
if (!content.includes('Đánh giá sản phẩm')) {
  // Look for completed orders section and add review buttons
  const completedPattern = /TabsContent value="completed"[\s\S]*?{completedOrders\.map\(\(order\) => \{[\s\S]*?{order\.OrderItem\.map\(\(item, idx\) => \{[\s\S]*?<\/div>\s*<\/div>\s*}\)}\s*<\/div>\s*<div className="flex items-center justify-between pt-4 border-t">/m;
  
  if (completedPattern.test(content)) {
    content = content.replace(
      /(<div className="flex items-center justify-between pt-4 border-t">[\s\S]*?{completedOrders\.map[\s\S]*?)})/m,
      function(match) {
        // In completed orders only, add review button
        if (match.includes('completedOrders')) {
          return match.replace(
            /}}\s*<\/div>\s*<div className="flex items-center justify-between pt-4 border-t">/,
            `}}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => setReviewModal({
                                  open: true,
                                  productId: item.Product.id,
                                  productName: item.Product.name,
                                  orderId: order.id
                                })}
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Đánh giá
                              </Button>
                            </div>
                          </div>
                    <div className="flex items-center justify-between pt-4 border-t">`
          );
        }
        return match;
      }
    );
  }
}

fs.writeFileSync(filePath, content);
console.log('Final update completed');
