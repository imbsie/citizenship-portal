import React, { useState } from 'react';
import { Upload, Check, AlertCircle, ChevronDown, ChevronUp, Trash2, Download } from 'lucide-react';
import Head from 'next/head';

export default function CitizenshipPortal() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [applications, setApplications] = useState([]);
  const [expandedApp, setExpandedApp] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const documentStructure = {
    'إثبات الهوية': [
      { id: 'passport_bio', label: 'صفحة المعلومات البيومترية من جواز السفر الحالي (نسخة ملونة معتمدة)', required: true },
      { id: 'travel_doc', label: 'صفحة المعلومات البيومترية من وثيقة السفر الحالية (نسخة ملونة معتمدة)', required: true },
      { id: 'affidavit', label: 'تصريح موثق (إذا لم يكن لديك جواز سفر)', required: false },
      { id: 'passport_cert_form', label: 'نموذج اعتماد جواز السفر (موقع من محام)', required: true },
      { id: 'birth_cert', label: 'شهادة الميلاد الأصلية (نسخة ملونة معتمدة)', required: true },
      { id: 'birth_cert_trans', label: 'شهادة الميلاد المترجمة (نسخة ملونة)', required: false },
      { id: 'marriage_cert', label: 'شهادة الزواج (نسخة ملونة معتمدة)', required: false },
      { id: 'marriage_cert_trans', label: 'شهادة الزواج المترجمة (نسخة ملونة)', required: false },
      { id: 'irp_card', label: 'بطاقة الإقامة الأيرلندية - الأمام والخلف (معتمدة)', required: true },
      { id: 'pps_card', label: 'بطاقة الخدمات العامة - الأمام والخلف (معتمدة)', required: true },
      { id: 'driving_license', label: 'رخصة القيادة الأيرلندية - الأمام والخلف (معتمدة)', required: true },
      { id: 'refugee_letter', label: 'خطاب حالة اللاجئ (معتمد)', required: false }
    ],
    'إثبات الإقامة': [
      { id: 'employment_summary', label: 'ملخص تفاصيل التوظيف (لكل سنة)', required: true },
      { id: 'bank_statement', label: 'كشف الحساب البنكي (لكل سنة)', required: true },
      { id: 'social_contribution', label: 'بيان المساهمة في الحماية الاجتماعية (لكل سنة)', required: true },
      { id: 'social_payment', label: 'بيان دفع الحماية الاجتماعية (لكل سنة)', required: true },
      { id: 'rent_agreement', label: 'عقد الإيجار', required: false },
      { id: 'landlord_ref', label: 'خطاب مرجعي من المالك أو شركة العقارات', required: false },
      { id: 'ipas_letter', label: 'خطاب إثبات العنوان من IPAS', required: false },
      { id: 'utility_bills', label: 'فواتير المرافق (الكهرباء والغاز والإنترنت)', required: false }
    ],
    'المعلومات الشخصية': [
      { id: 'asylum_date', label: 'تاريخ طلب الحماية', required: true },
      { id: 'refugee_date', label: 'تاريخ الحصول على حالة اللاجئ', required: true },
      { id: 'references', label: '3 مراجع أيرلندية مع أرقام الهاتف', required: true }
    ]
  };

  const createApplication = () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      alert('يرجى إدخال اسم العميل والبريد الإلكتروني');
      return;
    }

    const newApp = {
      id: Date.now(),
      clientName,
      clientEmail,
      createdDate: new Date().toLocaleDateString('ar-EG'),
      documents: {}
    };

    Object.keys(documentStructure).forEach(category => {
      documentStructure[category].forEach(doc => {
        newApp.documents[doc.id] = {
          status: 'pending',
          file: null,
          fileName: '',
          fileUrl: '',
          fileSize: '',
          reviewNotes: '',
          uploadedDate: null
        };
      });
    });

    setApplications([newApp, ...applications]);
    setClientName('');
    setClientEmail('');
    setShowForm(false);
  };

  const handleFileUpload = async (appId, docId, file) => {
    if (!file) return;

    setUploadingDoc(`${appId}-${docId}`);
    setUploadProgress({ [`${appId}-${docId}`]: 0 });

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64File = e.target.result.split(',')[1];

        // Get client name for this app
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        // Upload to Vercel Blob
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: base64File,
            fileName: file.name,
            clientName: app.clientName,
            docId: docId
          })
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        // Update application with file info
        const updatedApps = applications.map(a => {
          if (a.id === appId) {
            return {
              ...a,
              documents: {
                ...a.documents,
                [docId]: {
                  ...a.documents[docId],
                  status: 'review',
                  file: file,
                  fileName: file.name,
                  fileUrl: data.url,
                  fileSize: (data.size / 1024).toFixed(2) + ' KB',
                  uploadedDate: new Date().toLocaleDateString('ar-EG')
                }
              }
            };
          }
          return a;
        });

        setApplications(updatedApps);
        setUploadingDoc(null);
        setUploadProgress({});
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('فشل رفع الملف. يرجى المحاولة مرة أخرى.');
      setUploadingDoc(null);
      setUploadProgress({});
    }
  };

  const updateDocStatus = (appId, docId, status, notes = '') => {
    const updatedApps = applications.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          documents: {
            ...app.documents,
            [docId]: {
              ...app.documents[docId],
              status: status,
              reviewNotes: notes
            }
          }
        };
      }
      return app;
    });
    setApplications(updatedApps);
  };

  const deleteDocument = (appId, docId) => {
    const updatedApps = applications.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          documents: {
            ...app.documents,
            [docId]: {
              status: 'pending',
              file: null,
              fileName: '',
              fileUrl: '',
              fileSize: '',
              reviewNotes: '',
              uploadedDate: null
            }
          }
        };
      }
      return app;
    });
    setApplications(updatedApps);
  };

  const getProgress = (app) => {
    const docs = Object.values(app.documents);
    const approved = docs.filter(d => d.status === 'approved').length;
    return Math.round((approved / docs.length) * 100);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-emerald-50 border-emerald-300';
      case 'review': return 'bg-yellow-50 border-yellow-300';
      case 'rejected': return 'bg-red-50 border-red-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <Check className="w-5 h-5" style={{color: '#004D44'}} />;
      case 'rejected': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'review': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Upload className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <>
      <Head>
        <title>بوابة تطبيق الجنسية الأيرلندية</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f5f3f0;
          color: #333;
        }
        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .header {
          margin-bottom: 32px;
        }
        .header h1 {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #004D44;
        }
        .header p {
          font-size: 18px;
          color: #BFA662;
        }
        .form-section {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          padding: 24px;
          margin-bottom: 32px;
          border-right: 4px solid #BFA662;
        }
        .form-section h2 {
          font-size: 24px;
          font-weight: bold;
          color: #004D44;
          margin-bottom: 16px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #2C0E37;
          margin-bottom: 8px;
        }
        .form-group input {
          padding: 8px 16px;
          border: 1px solid #BFA662;
          border-radius: 8px;
          font-size: 14px;
          color: #004D44;
        }
        .form-group input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(191, 166, 98, 0.1);
        }
        .button-group {
          display: flex;
          gap: 8px;
        }
        .btn {
          font-weight: 600;
          padding: 8px 24px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          color: white;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn:hover {
          opacity: 0.9;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-primary {
          background-color: #004D44;
        }
        .btn-secondary {
          background-color: #BFA662;
        }
        .btn-danger {
          background-color: #690375;
        }
        .btn-success {
          background-color: #059669;
        }
        .btn-warning {
          background-color: #d97706;
        }
        .applications-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .app-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .app-header {
          background: linear-gradient(to left, #004D44, #2C0E37);
          color: white;
          padding: 24px;
          cursor: pointer;
          transition: opacity 0.2s;
          direction: rtl;
          text-align: right;
        }
        .app-header:hover {
          opacity: 0.9;
        }
        .app-header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .app-info h3 {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .app-info p {
          color: #d0d0d0;
          font-size: 14px;
        }
        .app-progress {
          margin-top: 16px;
          background-color: #999;
          border-radius: 9999px;
          height: 8px;
          overflow: hidden;
        }
        .progress-bar {
          background-color: #BFA662;
          height: 100%;
          transition: width 0.3s;
        }
        .app-details {
          padding: 24px;
          direction: rtl;
          text-align: right;
        }
        .category {
          margin-bottom: 24px;
        }
        .category h4 {
          font-size: 18px;
          font-weight: bold;
          color: #004D44;
          padding-bottom: 8px;
          border-bottom: 2px solid #BFA662;
          margin-bottom: 16px;
        }
        .document-item {
          padding: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .document-item.approved {
          background-color: #f0fdf4;
          border-color: #86efac;
        }
        .document-item.review {
          background-color: #fffbeb;
          border-color: #fcd34d;
        }
        .document-item.rejected {
          background-color: #fef2f2;
          border-color: #fca5a5;
        }
        .document-label {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .document-label label {
          font-weight: 600;
          color: #2C0E37;
        }
        .required {
          color: #dc2626;
          font-weight: bold;
        }
        .file-info {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
          margin-right: 32px;
        }
        .footer {
          margin-top: 32px;
          text-align: center;
          color: #BFA662;
          font-size: 14px;
        }
        .empty-state {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 32px;
          text-align: center;
        }
        .empty-state p {
          color: #666;
          margin-bottom: 16px;
        }
        .upload-loading {
          display: inline-block;
          opacity: 0.6;
        }
      `}</style>

      <div className="container" dir="rtl">
        <div className="header">
          <h1>بوابة تطبيق الجنسية الأيرلندية</h1>
          <p>خدمات إمّاد موسى التجارية المحدودة</p>
        </div>

        {showForm && (
          <div className="form-section">
            <h2>إنشاء طلب جديد</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>اسم العميل</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="أدخل اسم العميل"
                />
              </div>
              <div className="form-group">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
            </div>
            <div className="button-group">
              <button className="btn btn-primary" onClick={createApplication}>
                إنشاء الطلب
              </button>
              {applications.length > 0 && (
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  إخفاء النموذج
                </button>
              )}
            </div>
          </div>
        )}

        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <p>لا توجد طلبات حتى الآن</p>
              {!showForm && (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  عرض النموذج
                </button>
              )}
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="app-card">
                <div 
                  className="app-header"
                  onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                >
                  <div className="app-header-content">
                    <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
                      <div>
                        <p style={{fontSize: '32px', fontWeight: 'bold'}}>{getProgress(app)}%</p>
                        <p style={{fontSize: '12px'}}>مكتمل</p>
                      </div>
                      <div className="app-info">
                        <h3>{app.clientName}</h3>
                        <p>{app.clientEmail}</p>
                      </div>
                    </div>
                    {expandedApp === app.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                  <div className="app-progress">
                    <div className="progress-bar" style={{width: `${getProgress(app)}%`}}></div>
                  </div>
                </div>

                {expandedApp === app.id && (
                  <div className="app-details">
                    {Object.entries(documentStructure).map(([category, docs]) => (
                      <div key={category} className="category">
                        <h4>{category}</h4>
                        {docs.map(doc => {
                          const docData = app.documents[doc.id];
                          const isUploading = uploadingDoc === `${app.id}-${doc.id}`;
                          
                          return (
                            <div 
                              key={doc.id} 
                              className={`document-item ${docData.status}`}
                            >
                              <div style={{flex: 1}}>
                                <div className="document-label">
                                  {getStatusIcon(docData.status)}
                                  <label>{doc.label}</label>
                                  {doc.required && <span className="required">*</span>}
                                </div>
                                {docData.fileName && (
                                  <div className="file-info">
                                    📄 {docData.fileName} • {docData.fileSize} • {docData.uploadedDate}
                                  </div>
                                )}
                              </div>
                              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                {docData.fileUrl && (
                                  <a href={docData.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success" style={{fontSize: '12px', padding: '6px 12px'}}>
                                    <Download size={16} /> تحميل
                                  </a>
                                )}
                                {docData.status === 'pending' ? (
                                  <label className={`btn btn-primary ${isUploading ? 'upload-loading' : ''}`} style={{fontSize: '12px', padding: '6px 12px'}}>
                                    {isUploading ? 'جاري الرفع...' : 'رفع'}
                                    <input
                                      type="file"
                                      onChange={(e) => handleFileUpload(app.id, doc.id, e.target.files?.[0])}
                                      style={{display: 'none'}}
                                      disabled={isUploading}
                                    />
                                  </label>
                                ) : (
                                  <button 
                                    className="btn btn-danger"
                                    onClick={() => deleteDocument(app.id, doc.id)}
                                    style={{fontSize: '12px', padding: '6px 12px'}}
                                  >
                                    <Trash2 size={16} /> حذف
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="footer">
          <p>خدمات إمّاد موسى التجارية المحدودة • دعم تطبيق الجنسية الأيرلندية</p>
        </div>
      </div>
    </>
  );
}
