require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// إعداد nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // استخدام متغير البيئة
    pass: process.env.EMAIL_PASS_ORDER // استخدام متغير البيئة
  }
});

// إعداد transporter خاص بنموذج اتصل بنا
const contactTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // استخدام نفس الإيميل
    pass: process.env.EMAIL_PASS_CONTACT // استخدام متغير بيئة مختلف
  }
});

// استقبال تفاصيل الطلب وإرسالها للإيميل
app.post('/api/send-order', async (req, res) => {
  console.log('Received order request:', req.body); // للتأكد من استقبال الطلب
  
  const { cart, shippingData, total, paymentMethod } = req.body;
  
  // المنتجات التجريبية (يمكنك جلبها من قاعدة بيانات)
  const products = [
    { id: 1, name: 'فلتر زيت تويوتا أصلي', price: 45 },
    { id: 2, name: 'زيت محرك شل 5W-30', price: 120 },
    { id: 3, name: 'فرامل سيراميك أمامية هونداي', price: 180 },
    { id: 4, name: 'بطارية AC Delco 70 أمبير', price: 350 },
    { id: 5, name: 'إطار ميشلان 17 إنش', price: 520 }
  ];

  // تجهيز تفاصيل المنتجات
  let orderDetails = '';
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      orderDetails += `- ${product.name}: ${item.qty} × ${product.price} د.أ = ${product.price * item.qty} د.أ\n`;
    }
  });

  const mailOptions = {
    from: 'nawafzwd25@gmail.com',
    to: 'nawafzwd25@gmail.com',
    subject: 'طلب جديد من متجر قطع السيارات',
    html: `
      <h2>طلب جديد من متجر قطع السيارات</h2>
      
      <h3>معلومات العميل:</h3>
      <p><strong>الاسم:</strong> ${shippingData.fullname}</p>
      <p><strong>رقم الجوال:</strong> ${shippingData.phone}</p>
      <p><strong>العنوان:</strong> ${shippingData.address}</p>
      <p><strong>المدينة:</strong> ${shippingData.city}</p>
      <p><strong>ملاحظات:</strong> ${shippingData.notes || 'لا توجد ملاحظات'}</p>
      
      <h3>تفاصيل الطلب:</h3>
      <pre>${orderDetails}</pre>
      
      <h3>المجموع الكلي: ${total} د.أ</h3>
      
      <h3>طريقة الدفع: ${paymentMethod === 'cod' ? 'دفع عند الاستلام' : 'PayPal'}</h3>
      
      <p><em>تم إرسال هذا الطلب في: ${new Date().toLocaleString('ar-SA')}</em></p>
    `
  };

  console.log('Sending email with options:', mailOptions); // للتأكد من إعداد الإيميل

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result); // للتأكد من إرسال الإيميل
    res.json({ success: true, message: 'تم إرسال الطلب بنجاح' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// استقبال رسائل الاتصال وإرسالها للإيميل
app.post('/api/send-contact', async (req, res) => {
  console.log('Received contact request:', req.body);
  
  const { name, email, phone, message } = req.body;
  
  const mailOptions = {
    from: 'nawafzwd25@gmail.com',
    to: 'nawafzwd25@gmail.com',
    subject: 'رسالة جديدة من صفحة اتصل بنا',
    html: `
      <h2>رسالة جديدة من صفحة اتصل بنا</h2>
      
      <h3>معلومات المرسل:</h3>
      <p><strong>الاسم:</strong> ${name}</p>
      <p><strong>البريد الإلكتروني:</strong> ${email}</p>
      <p><strong>رقم الهاتف:</strong> ${phone}</p>
      
      <h3>الرسالة:</h3>
      <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; border-right: 4px solid #e53935;">${message}</p>
      
      <p><em>تم إرسال هذه الرسالة في: ${new Date().toLocaleString('ar-SA')}</em></p>
    `
  };

  console.log('Sending contact email with options:', mailOptions);

  try {
    const result = await contactTransporter.sendMail(mailOptions);
    console.log('Contact email sent successfully:', result);
    res.json({ success: true, message: 'تم إرسال رسالتك بنجاح' });
  } catch (err) {
    console.error('Error sending contact email:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('Backend running on port', PORT)); 