# ⚡ Quick Setup Checklist

## 🎯 **Immediate Steps to Deploy**

### **1. Create Environment File**
Create `.env` file in root directory:

```env
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FUNCTIONS_REGION=us-central1
```

### **2. Get Paystack API Keys**
1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Settings → API Keys & Webhooks
3. Copy Test Public Key and Test Secret Key

### **3. Run Deployment**

**For Windows:**
```bash
deploy.bat
```

**For Mac/Linux:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Manual Steps:**
```bash
# Install dependencies
npm install react-paystack-inline-js
cd functions && npm install paystack axios crypto && cd ..

# Deploy
firebase deploy --only functions
npm run build
firebase deploy --only hosting
```

### **4. Configure Webhook**
1. Get your webhook URL: `https://your-project-id.cloudfunctions.net/paystackWebhook`
2. Add to Paystack Dashboard → Settings → Webhooks
3. Select events: `subscription.create`, `subscription.enable`, `subscription.disable`, `charge.success`, `charge.failed`

### **5. Test**
1. Visit your deployed site
2. Go to `/subscription`
3. Use test card: `4084 0840 8408 4081`

## 🔧 **Troubleshooting Quick Fixes**

### **Functions Not Deploying**
```bash
firebase functions:delete
firebase deploy --only functions
```

### **Payment Not Working**
- Check browser console for errors
- Verify Paystack API keys in `.env`
- Ensure webhook is configured

### **Build Errors**
```bash
npm install
npm run build
```

## 📞 **Need Help?**

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review Firebase Functions logs: `firebase functions:log`
3. Test with Paystack test cards
4. Verify environment variables are set correctly

## 🎉 **Success Indicators**

- ✅ Functions deploy without errors
- ✅ Frontend builds successfully
- ✅ Webhook receives events
- ✅ Payment modal opens
- ✅ Subscription data appears in Firestore

---

**Your subscription system will be live at:**
`https://your-project-id.web.app`
