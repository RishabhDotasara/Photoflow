from insightface.app import FaceAnalysis
import cv2

fa = FaceAnalysis(allowed_modules=['detection', 'recognition'])
fa.prepare(ctx_id=0, det_size=(640, 640))

img_bgr = cv2.imread("test.png")
img = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

faces = fa.get(img)  # list of face objects
for i, f in enumerate(faces, start=1):
    print("bbox:", f.bbox)           # bounding box
    emb = f.embedding                # numpy array (typically 512-d)
    print("embedding shape:", emb.shape)
    # print("embedding: ", emb)

for i, f in enumerate(faces, start=1):
    x1, y1, x2, y2 = map(int, f.bbox)
    cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.putText(img_bgr, str(i), (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

cv2.imshow("detected faces", img_bgr)
cv2.waitKey(0)
cv2.destroyAllWindows()