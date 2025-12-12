// File: pages/index.js
// Place this in your pages/ folder

import React, { useState } from 'react';
import { Upload, Check, AlertCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import Head from 'next/head';

export default function CitizenshipPortal() {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [applications, setApplications] = useState([]);
  const [expandedApp, setExpandedApp] = useState(null);

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

  const handleFileUpload = (appId, docId, file) => {
    if (!file) return;
    
    const updatedApps = applications.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          documents: {
            ...app.documents,
            [docId]: {
              ...app.documents[docId],
              status: 'review',
              file: file,
              fileName: file.name,
              uploadedDate: new Date().toLocaleDateString('ar-EG')
            }
          }
        };
      }
      return app;
    });
    setApplications(updatedApps);
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
        <title>بوابة تطبيق الجنسية الأيرلندية - Irish Citizenship Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Irish Citizenship Application Portal by Imad Mousa Business Services" />
      </Head>
      
      <div className="min-h-screen p-6" style={{backgroundColor: '#f5f3f0'}} dir="rtl">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{color: '#004D44'}}>بوابة تطبيق الجنسية الأيرلندية</h1>
            <p className="text-lg" style={{color: '#BFA662'}}>خدمات إمّاد موسى التجارية المحدودة</p>
          </div>

          {/* New Application Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8" style={{borderRight: '4px solid #BFA662'}}>
              <h2 className="text-2xl font-bold mb-4" style={{color: '#004D44'}}>إنشاء طلب جديد</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2C0E37'}}>اسم العميل</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="أدخل اسم العميل"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                      style={{borderColor: '#BFA662', color: '#004D44'}}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{color: '#2C0E37'}}>البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="أدخل البريد الإلكتروني"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                      style={{borderColor: '#BFA662', color: '#004D44'}}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={createApplication}
                    className="text-white font-semibold py-2 px-6 rounded-lg transition hover:opacity-90"
                    style={{backgroundColor: '#004D44'}}
                  >
                    إنشاء الطلب
                  </button>
                  {applications.length > 0 && (
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-white font-semibold py-2 px-6 rounded-lg transition hover:opacity-90"
                      style={{backgroundColor: '#BFA662'}}
                    >
                      إخفاء النموذج
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Applications List - Main Content */}
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-lg mb-4" style={{color: '#666'}}>لا توجد طلبات حتى الآن</p>
                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-white font-semibold py-2 px-6 rounded-lg transition hover:opacity-90"
                    style={{backgroundColor: '#004D44'}}
                  >
                    عرض النموذج
                  </button>
                )}
              </div>
            ) : (
              applications.map(app => (
                <div key={app.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div 
                    onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                    className="text-white p-6 cursor-pointer transition hover:opacity-90"
                    style={{background: 'linear-gradient(to left, #004D44, #2C0E37)'}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">{app.clientName}</h3>
                        <p className="text-gray-200">{app.clientEmail}</p>
                      </div>
                      <div className="flex items-center gap-6 ml-6">
                        <div className="text-left">
                          <p className="text-3xl font-bold">{getProgress(app)}%</p>
                        </div>
                        {expandedApp === app.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </div>
                    </div>
                  </div>

                  {expandedApp === app.id && (
                    <div className="p-6 space-y-6">
                      {Object.entries(documentStructure).map(([category, docs]) => (
                        <div key={category}>
                          <h4 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{color: '#004D44', borderColor: '#BFA662'}}>
                            {category}
                          </h4>
                          <div className="space-y-3">
                            {docs.map(doc => {
                              const docData = app.documents[doc.id];
                              return (
                                <div key={doc.id} className={`p-4 border-2 rounded-lg ${getStatusColor(docData.status)}`}>
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        {getStatusIcon(docData.status)}
                                        <label className="font-semibold" style={{color: '#2C0E37'}}>{doc.label}</label>
                                        {doc.required && <span className="text-red-600 font-bold">*</span>}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {docData.status === 'pending' ? (
                                        <label className="text-white px-3 py-1 rounded text-sm cursor-pointer" style={{backgroundColor: '#004D44'}}>
                                          رفع
                                          <input
                                            type="file"
                                            onChange={(e) => handleFileUpload(app.id, doc.id, e.target.files?.[0])}
                                            className="hidden"
                                          />
                                        </label>
                                      ) : (
                                        <button
                                          onClick={() => deleteDocument(app.id, doc.id)}
                                          className="text-white px-3 py-1 rounded text-sm"
                                          style={{backgroundColor: '#690375'}}
                                        >
                                          حذف
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm" style={{color: '#BFA662'}}>
            <p>خدمات إمّاد موسى التجارية المحدودة • دعم تطبيق الجنسية الأيرلندية</p>
          </div>
        </div>
      </div>
    </>
  );
}