# Hướng dẫn cài đặt Cloudflare R2 Storage từ đầu cho project này

Tài liệu này hướng dẫn đầy đủ cách cấu hình Cloudflare R2 cho project `bloggin-website` để chạy **local ổn định**, không làm vỡ route `/admin`, không kéo theo lỗi `worker_threads`, và hạn chế rủi ro lỗi khi build hoặc regenerate import map sau này.

Tài liệu này bám đúng cấu hình đang chạy trong repo hiện tại.

## 1. Mục tiêu của cấu hình này

Sau khi làm xong, project sẽ có các đặc điểm sau:

- Collection `media` của Payload lưu file vào R2 thay vì local filesystem.
- Khi chạy local, R2 dùng bucket local mock của Wrangler.
- Admin route của Payload không bị lỗi `Module not found: Can't resolve 'worker_threads'`.
- Cấu hình an toàn cho local, dễ dùng lại sau này.

## 2. Vì sao trước đó bị lỗi

Khi bật `@payloadcms/storage-r2` theo cách mặc định, package này có thể đăng ký thêm client upload handler cho admin của Payload.

Handler đó đi qua import:

```text
@payloadcms/storage-r2/client
```

Sau đó kéo tiếp một chuỗi dependency server-only, cuối cùng đụng vào:

```text
worker_threads
```

Hệ quả là khi mở `/admin`, Next.js cố bundle một phần code không phù hợp cho phía admin/client và gây lỗi:

```text
Module not found: Can't resolve 'worker_threads'
```

Vì vậy, với project này, cách an toàn là:

1. Vẫn dùng `@payloadcms/storage-r2` để lưu file lên R2.
2. Chỉ dùng upload theo đường server-side.
3. Gỡ phần client upload handler khỏi admin import map sau khi plugin R2 được áp dụng.

Đây là điểm quan trọng nhất để cấu hình **không bị vỡ**.

## 3. Điều kiện cần trước khi bắt đầu

Bạn cần có:

- `pnpm`
- `Node.js` phù hợp với project
- File `.env` có `PAYLOAD_SECRET`

Ví dụ `.env` tối thiểu:

```env
PAYLOAD_SECRET=your-secret-here
```

## 4. Cài dependency

Chạy lệnh:

```bash
pnpm install
```

Giải thích:

- Cài toàn bộ dependency của project.
- Project này đã có sẵn package `@payloadcms/storage-r2` trong `package.json`, nên không cần cài tay thêm lần nữa nếu repo đang đúng như hiện tại.

Nếu bạn cần cài lại từ đầu trong repo khác, dùng:

```bash
pnpm add @payloadcms/storage-r2
```

## 5. Cấu hình Wrangler cho local R2

Mở file `wrangler.jsonc` và đảm bảo có phần `r2_buckets` như sau:

```jsonc
"r2_buckets": [
  {
    "binding": "R2",
    "bucket_name": "bloggin-website-media",
    "preview_bucket_name": "bloggin-website-media-preview",
    "remote": false
  }
]
```

Ý nghĩa:

- `binding: "R2"`: tên binding dùng trong code.
- `bucket_name`: tên bucket chính.
- `preview_bucket_name`: bucket mà Wrangler ưu tiên dùng trong local development.
- `remote: false`: bắt local dùng storage mock/local của Wrangler thay vì bucket thật trên Cloudflare.

Lý do nên có `preview_bucket_name`:

- Trong local dev, Wrangler thích có bucket riêng cho môi trường phát triển.
- Nó giúp tránh lẫn dữ liệu local với dữ liệu production/staging.

## 6. Cấu hình Payload để dùng R2 an toàn

Mở file `src/payload.config.ts`.

### 6.1. Import package R2

Đảm bảo có các import này:

```ts
import { r2Storage } from '@payloadcms/storage-r2'
import { buildConfig, type Config } from 'payload'
```

### 6.2. Tạo helper gỡ client upload handler gây lỗi admin

Thêm đoạn sau:

```ts
const r2ClientHandlerPath = '@payloadcms/storage-r2/client#R2ClientUploadHandler'

function removeDisabledR2ClientUploadHandler(config: Config): Config {
  const nextConfig = { ...config }

  if (nextConfig.admin?.dependencies) {
    delete nextConfig.admin.dependencies[r2ClientHandlerPath]
  }

  const providers = nextConfig.admin?.components?.providers

  if (providers) {
    nextConfig.admin.components.providers = providers.filter(
      (provider) =>
        !provider || typeof provider === 'string' || provider.path !== r2ClientHandlerPath,
    )
  }

  return nextConfig
}
```

Giải thích:

- Plugin R2 mặc định có thể thêm handler client-side vào admin.
- Handler này là nguyên nhân khiến `/admin` có thể bị lỗi `worker_threads`.
- Helper trên sẽ xóa handler đó khỏi `admin.dependencies` và `admin.components.providers`.
- Kết quả là admin vẫn hoạt động, còn upload sẽ đi qua server-side flow.

### 6.3. Bật plugin R2

Thêm phần plugin như sau:

```ts
const r2Plugins = cloudflare.env.R2
  ? [
      r2Storage({
        alwaysInsertFields: true,
        bucket: cloudflare.env.R2,
        collections: { media: true },
      }),
      removeDisabledR2ClientUploadHandler,
    ]
  : []
```

Giải thích:

- `bucket: cloudflare.env.R2`: lấy binding `R2` từ Cloudflare/Wrangler context.
- `collections: { media: true }`: áp dụng R2 cho collection `media`.
- `alwaysInsertFields: true`: giữ schema ổn định hơn giữa các môi trường.
- `removeDisabledR2ClientUploadHandler`: bước chống vỡ admin quan trọng nhất của repo này.

### 6.4. Gắn plugin vào Payload config

Trong `buildConfig`, đảm bảo có:

```ts
plugins: r2Plugins,
```

## 7. Cấu hình đang dùng trong repo hiện tại

Hiện tại repo này đang dùng đúng hướng an toàn:

- Bật `r2Storage` cho collection `media`
- Không dùng client multipart upload trong admin
- Chỉ dùng server-side upload flow cho local
- Gỡ import `@payloadcms/storage-r2/client` khỏi import map của admin

Điều này giúp tránh lỗi:

```text
Module not found: Can't resolve 'worker_threads'
```

## 8. Regenerate import map sau khi sửa config

Sau khi sửa `src/payload.config.ts`, chạy:

```bash
pnpm run generate:importmap
```

Giải thích:

- Payload admin dùng import map để biết cần nạp component/provider nào.
- Nếu bạn đã thay đổi plugin hoặc dependency admin mà không regenerate import map, admin có thể vẫn giữ import cũ.

## 9. Kiểm tra import map đã sạch chưa

Mở file:

```text
src/app/(payload)/admin/importMap.js
```

Kết quả đúng trong repo hiện tại là file này **không còn** import:

```text
@payloadcms/storage-r2/client
```

Ví dụ đúng:

```js
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  "@payloadcms/next/rsc#CollectionCards": CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1
}
```

Nếu bạn vẫn thấy `@payloadcms/storage-r2/client` trong file này, hãy:

1. Kiểm tra lại `removeDisabledR2ClientUploadHandler`
2. Chạy lại `pnpm run generate:importmap`
3. Restart dev server

## 10. Kiểm tra TypeScript

Chạy lệnh:

```bash
pnpm exec tsc --noEmit
```

Giải thích:

- Xác nhận cấu hình mới không gây lỗi type.
- Đây là bước nên chạy mỗi lần bạn sửa `payload.config.ts`.

## 11. Chạy local

Chạy:

```bash
pnpm dev
```

Sau đó:

1. Mở admin của Payload
2. Đăng nhập
3. Vào collection `media`
4. Upload thử một file

Kết quả mong đợi:

- `/admin` mở bình thường
- Không còn lỗi `worker_threads`
- Upload hoạt động
- File đi qua R2 adapter

## 12. Kiểm tra R2 local bằng CLI

Nếu bạn muốn kiểm tra R2 local độc lập với admin, làm như sau.

### Bước 1: Tạo file test

```bash
printf 'hello from local r2\n' > /tmp/r2-local.txt
```

### Bước 2: Upload file vào local R2

```bash
pnpm wrangler r2 object put bloggin-website-media-preview/hello.txt --file /tmp/r2-local.txt --local --persist-to .wrangler/state
```

Giải thích:

- `bloggin-website-media-preview` là `preview_bucket_name`
- `--local` ép thao tác trên bucket local
- `--persist-to .wrangler/state` giúp local storage được giữ lại giữa các lần chạy

### Bước 3: Download file từ local R2

```bash
pnpm wrangler r2 object get bloggin-website-media-preview/hello.txt --file /tmp/r2-local-out.txt --local --persist-to .wrangler/state
```

### Bước 4: Đọc file đã tải về

```bash
cat /tmp/r2-local-out.txt
```

Nếu thấy:

```text
hello from local r2
```

thì local R2 đang chạy đúng.

## 13. Khi nào cần restart dev server

Bạn nên dừng và chạy lại `pnpm dev` nếu vừa thay đổi một trong các phần sau:

- `src/payload.config.ts`
- `wrangler.jsonc`
- `src/app/(payload)/admin/importMap.js`

Lý do:

- Next.js dev cache có thể giữ import cũ
- Payload admin import map không tự cập nhật trong mọi tình huống

## 14. Nếu admin vẫn lỗi sau khi đã sửa

Làm lần lượt:

### Bước 1: Regenerate import map

```bash
pnpm run generate:importmap
```

### Bước 2: Xóa cache Next.js

```bash
rm -rf .next
```

### Bước 3: Chạy lại dev

```bash
pnpm dev
```

Nếu vẫn lỗi, kiểm tra lại `src/app/(payload)/admin/importMap.js` có còn import `@payloadcms/storage-r2/client` hay không.

## 15. Kiểm tra build

Bạn có thể chạy:

```bash
pnpm build
```

Lưu ý:

- Trong repo hiện tại, phần compile và typecheck đã pass sau khi cấu hình R2.
- Nếu build đứng lâu ở `Collecting page data`, đó là hiện trạng của project, không phải dấu hiệu chính cho thấy cấu hình R2 bị lỗi.

## 16. Reset local state khi cần

Nếu muốn xóa toàn bộ state local của Wrangler:

```bash
rm -rf .wrangler/state
```

Giải thích:

- Xóa dữ liệu local D1 và R2 đang được persist
- Lần chạy sau sẽ tạo state mới

## 17. Checklist chuẩn để làm lại từ đầu sau này

Mỗi khi cần setup lại R2 cho repo này, hãy đi đúng thứ tự:

1. Cài dependency với `pnpm install`
2. Kiểm tra `wrangler.jsonc` có binding `R2`
3. Kiểm tra `src/payload.config.ts` có `r2Storage(...)`
4. Giữ helper `removeDisabledR2ClientUploadHandler`
5. Chạy `pnpm run generate:importmap`
6. Kiểm tra `importMap.js` không còn `@payloadcms/storage-r2/client`
7. Chạy `pnpm exec tsc --noEmit`
8. Chạy `pnpm dev`
9. Test upload trong admin
10. Test local R2 bằng `wrangler r2 object put/get` nếu cần

## 18. Ghi chú quan trọng

- Với repo này, đừng bật lại client upload handler mặc định của `@payloadcms/storage-r2` nếu chưa kiểm tra kỹ bundle admin.
- Nếu đổi tên bucket trong `wrangler.jsonc`, hãy đổi luôn các lệnh test R2 trong tài liệu này.
- Nếu sau này chuyển sang dùng R2 thật trên Cloudflare, bạn có thể cần `wrangler login` và cấu hình bucket remote riêng.
- Mục tiêu của tài liệu này là local ổn định trước, sau đó mới mở rộng sang remote/deploy.
