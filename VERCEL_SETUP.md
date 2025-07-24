# Vercel Environment Variables Kurulum Rehberi

## 🚀 Vercel Dashboard'da Environment Variables Ekleme

### 1. Vercel Dashboard'a Giriş
- https://vercel.com/dashboard adresine gidin
- Projenizi seçin (monad-dog)

### 2. Environment Variables Bölümüne Git
- Proje sayfasında **Settings** sekmesine tıklayın
- Sol menüden **Environment Variables** seçin

### 3. Environment Variables Ekleme

Aşağıdaki environment variables'ları tek tek ekleyin:

#### 🔑 SUPABASE_URL
```
Name: SUPABASE_URL
Value: https://uhqszfoekqrjtybrwqzt.supabase.co
Environment: Production, Preview, Development
```

#### 🔑 SUPABASE_ANON_KEY
```
Name: SUPABASE_ANON_KEY
Value: [Supabase Dashboard'dan alacağınız anon key]
Environment: Production, Preview, Development
```

#### 🔑 NODE_ENV
```
Name: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

#### 🔑 RATE_LIMIT_WINDOW
```
Name: RATE_LIMIT_WINDOW
Value: 900000
Environment: Production, Preview, Development
```

#### 🔑 RATE_LIMIT_MAX_REQUESTS
```
Name: RATE_LIMIT_MAX_REQUESTS
Value: 100
Environment: Production, Preview, Development
```

#### 🔑 JWT_SECRET
```
Name: JWT_SECRET
Value: a2fHSKxZyAdywZqR5GvSt8pPmE5g1OclmNiyTMfEUNE=
Environment: Production, Preview, Development
```

#### 🔑 MONAD_RPC_URL
```
Name: MONAD_RPC_URL
Value: https://testnet-rpc.monad.xyz
Environment: Production, Preview, Development
```

#### 🔑 MONAD_CHAIN_ID
```
Name: MONAD_CHAIN_ID
Value: 10143
Environment: Production, Preview, Development
```

### 4. Supabase Anon Key Alma
1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin
3. **Settings** > **API** sekmesine gidin
4. **anon public** key'i kopyalayın
5. Bu key'i `SUPABASE_ANON_KEY` olarak Vercel'e ekleyin

### 5. Deploy Etme
Environment variables'ları ekledikten sonra:
1. **Deployments** sekmesine gidin
2. **Redeploy** butonuna tıklayın
3. Deploy'in tamamlanmasını bekleyin

### 6. Test Etme
Deploy tamamlandıktan sonra:
```bash
curl https://monad-dog.vercel.app/api/health
```

Başarılı response:
```json
{
  "status": "ok",
  "timestamp": "2025-07-24T16:31:31.035Z",
  "supabase": "connected",
  "version": "1.0.0",
  "message": "API is working!"
}
```

## ⚠️ Önemli Notlar

1. **Environment Variables'ları Production, Preview ve Development için ayrı ayrı ekleyin**
2. **SUPABASE_ANON_KEY'i gerçek değerle değiştirin**
3. **Environment variables ekledikten sonra redeploy yapın**
4. **Bu dosyaları git'e commit etmeyin (sensitive data içerir)**

## 🔧 Sorun Giderme

### Supabase Bağlantı Sorunu
- Supabase anon key'in doğru olduğundan emin olun
- Supabase projenizin aktif olduğunu kontrol edin
- API endpoint'lerini test edin: `/api/health`, `/api/test-supabase`

### Environment Variables Çalışmıyor
- Vercel Dashboard'da environment variables'ların doğru eklendiğini kontrol edin
- Production environment'ı seçtiğinizden emin olun
- Redeploy yapın

### 404 Hataları
- `vercel.json` dosyasının doğru yapılandırıldığını kontrol edin
- API routes'ların doğru tanımlandığını kontrol edin
