import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DataManagementPage = () => {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile);
    } else {
      toast.error(t('data_management.toast_excel_error'));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error(t('data_management.toast_select_first'));
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const loadToast = toast.loading(t('data_management.toast_importing'));
    try {
      await api.post('/upload-arborescence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('data_management.toast_import_success'), { id: loadToast });
      setFile(null);
    } catch (err) {
      console.error(err);
      const errorData = err.response?.data;
      if (errorData && errorData.message && errorData.message.startsWith('validation.')) {
        toast.error(t(errorData.message, errorData.params), { id: loadToast });
      } else {
        toast.error(errorData?.message || t('data_management.toast_import_error'), { id: loadToast });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t('data_management.confirm_reset'))) return;

    const loadToast = toast.loading(t('data_management.toast_resetting'));
    try {
      await api.get('/reset');
      toast.success(t('data_management.toast_reset_success'), { id: loadToast });
    } catch (err) {
      toast.error(t('data_management.toast_reset_error'), { id: loadToast });
    }
  };

  return (
    <div className="min-h-screen bg-[#fef3e8]/50 p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('data_management.title')}</h1>
          <p className="text-slate-500">{t('data_management.subtitle')}</p>
        </header>

        <div className="flex  md:grid-cols-2 gap-8">
          
          {/* Upload Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6 text-orange-600">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <UploadCloud size={28} />
              </div>
              <h2 className="text-xl font-bold">{t('data_management.import_title')}</h2>
            </div>

            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              {t('data_management.import_desc')}
            </p>

            <div 
              className={`flex-1 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center p-6 mb-8
                ${file ? 'border-green-300 bg-green-50' : 'border-orange-200 bg-orange-50/30 hover:border-orange-400'}`}
            >
              {file ? (
                <>
                  <FileSpreadsheet size={48} className="text-green-500 mb-3" />
                  <p className="text-sm font-semibold text-green-700 truncate max-w-full px-4">{file.name}</p>
                  <button onClick={() => setFile(null)} className="mt-2 text-xs text-red-500 hover:underline">{t('common.delete') || 'Supprimer'}</button>
                </>
              ) : (
                <>
                  <UploadCloud size={48} className="text-orange-300 mb-3" />
                  <label className="cursor-pointer">
                    <span className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:bg-orange-600 transition-colors">
                      {t('data_management.choose_file')}
                    </span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls" />
                  </label>
                  <p className="mt-3 text-xs text-slate-400 text-center">{t('data_management.drag_drop')}</p>
                </>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all
                ${!file || isUploading 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-200 hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isUploading ? t('data_management.importing') : t('data_management.launch_import')}
            </button>
          </div>

          {/* Configuration & Actions */}
          {/* <div className="space-y-8"> */}
            
            {/* Template Card */}
            {/* <div className="bg-white rounded-3xl p-8 shadow-sm border border-orange-100">
              <div className="flex items-center gap-4 mb-4 text-blue-600">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <Info size={24} />
                </div>
                <h2 className="text-lg font-bold">{t('data_management.guide_title')}</h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> {t('data_management.guide_item1')}</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> {t('data_management.guide_item2')}</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-green-500 shrink-0" /> {t('data_management.guide_item3')}</li>
              </ul>
              <button className="mt-6 text-sm text-blue-600 font-semibold hover:underline flex items-center gap-2">
                {t('data_management.download_template')}
              </button>
            </div> */}

            {/* Reset Card */}
            {/* <div className="bg-white rounded-3xl p-8 shadow-sm border border-red-50">
              <div className="flex items-center gap-4 mb-4 text-red-600">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <RefreshCw size={24} />
                </div>
                <h2 className="text-lg font-bold">{t('data_management.reset_title')}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                {t('data_management.reset_desc')}
              </p>
              <button
                onClick={handleReset}
                className="w-full py-3 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                {t('data_management.reset_btn')}
              </button>
            </div> */}

          {/* </div> */}
        </div>

        {/* Status Section */}
        <div className="mt-12 p-6 bg-orange-50/50 rounded-3xl border border-orange-100/50 flex items-center gap-4">
          <AlertCircle className="text-orange-400" />
          <p className="text-sm text-slate-600">
            {t('data_management.important_note')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataManagementPage;
