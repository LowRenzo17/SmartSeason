import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Bot, ImagePlus, Loader2, Send, Stethoscope, X } from 'lucide-react';
import { API_URL } from '../config';
import DiagnosisCard from '../components/DiagnosisCard';

const MAX_FILE_BYTES = 4 * 1024 * 1024;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CropDoctor() {
  const [searchParams] = useSearchParams();
  const [fields, setFields] = useState([]);
  const [fieldId, setFieldId] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [history, setHistory] = useState([]);

  const selectedField = useMemo(
    () => fields.find(field => String(field.id) === String(fieldId)),
    [fields, fieldId]
  );

  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await axios.get(`${API_URL}/fields?t=${Date.now()}`);
        setFields(res.data);
        const requestedFieldId = searchParams.get('fieldId');
        const requestedField = res.data.find(field => String(field.id) === String(requestedFieldId));
        if (requestedField) {
          setFieldId(String(requestedField.id));
        } else if (res.data.length > 0) {
          setFieldId(String(res.data[0].id));
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not load fields');
      }
    }

    fetchFields();
  }, [searchParams]);

  useEffect(() => {
    if (!fieldId) return;

    async function fetchHistory() {
      try {
        const res = await axios.get(`${API_URL}/diagnoses?fieldId=${fieldId}&t=${Date.now()}`);
        setHistory(res.data);
      } catch (err) {
        console.error(err);
        setHistory([]);
      }
    }

    fetchHistory();
  }, [fieldId]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Use a JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      toast.error('Image must be under 4MB');
      return;
    }

    try {
      setImageDataUrl(await fileToDataUrl(file));
    } catch (err) {
      console.error(err);
      toast.error('Could not read image');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fieldId || !imageDataUrl) {
      toast.error('Select a field and upload a crop image');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/diagnoses`, {
        fieldId,
        imageDataUrl,
        symptoms
      });
      setDiagnosis(res.data);
      toast.success('Diagnosis saved to field history');

      const historyRes = await axios.get(`${API_URL}/diagnoses?fieldId=${fieldId}&t=${Date.now()}`);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Stethoscope size={20} />
            <span className="text-[12px] uppercase tracking-widest font-bold">Crop Doctor</span>
          </div>
          <h1 className="text-[28px] font-bold text-on-surface leading-tight">AI Crop Diagnosis</h1>
          <p className="text-[14px] text-on-surface-variant mt-1">
            Upload a crop image, add symptoms, and save diagnosis guidance under a field.
          </p>
        </div>
        {selectedField && (
          <div className="bg-surface-container rounded-lg px-4 py-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant">Selected Field</p>
            <p className="text-[16px] font-bold text-on-surface">{selectedField.name}</p>
            <p className="text-[13px] text-on-surface-variant">{selectedField.cropType}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form onSubmit={handleSubmit} className="xl:col-span-5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-soft overflow-hidden">
          <div className="p-5 border-b border-outline-variant/30 flex items-center gap-3">
            <Bot className="text-primary" size={22} />
            <div>
              <h2 className="text-[16px] font-bold text-on-surface">Diagnosis Chat</h2>
              <p className="text-[12px] text-on-surface-variant">Image plus field context improves the answer.</p>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-2">Field</label>
              <select
                value={fieldId}
                onChange={event => setFieldId(event.target.value)}
                className="w-full h-[42px] px-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              >
                {fields.map(field => (
                  <option key={field.id} value={field.id}>{field.name} - {field.cropType}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-2">Crop Image</label>
              {imageDataUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-outline-variant/40 bg-surface">
                  <img src={imageDataUrl} alt="Crop preview" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl('')}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface-container-lowest text-on-surface shadow-soft flex items-center justify-center hover:bg-surface-container"
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="h-64 rounded-xl border border-dashed border-outline-variant bg-surface-container flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <ImagePlus size={36} className="text-primary mb-3" />
                  <span className="text-[14px] font-bold text-on-surface">Upload leaf or crop photo</span>
                  <span className="text-[12px] text-on-surface-variant mt-1">JPEG, PNG, or WebP under 4MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-2">Observed Symptoms</label>
              <textarea
                value={symptoms}
                onChange={event => setSymptoms(event.target.value)}
                placeholder="Example: yellow spots on lower leaves, wilting after rain, insects seen near stems..."
                className="w-full min-h-[130px] resize-none px-3 py-3 bg-surface border border-outline-variant rounded-[8px] text-[14px] text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !fields.length}
              className="w-full h-[46px] flex items-center justify-center gap-2 bg-primary text-white rounded-lg text-[12px] uppercase font-bold tracking-widest hover:bg-primary-container transition-colors shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Analyzing' : 'Diagnose Crop'}
            </button>
          </div>
        </form>

        <div className="xl:col-span-7 flex flex-col gap-6">
          {diagnosis ? (
            <DiagnosisCard diagnosis={diagnosis} />
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-8 min-h-[320px] flex flex-col justify-center items-center text-center shadow-soft">
              <Bot size={42} className="text-primary mb-4" />
              <h2 className="text-[20px] font-bold text-on-surface">Awaiting crop image</h2>
              <p className="text-[14px] text-on-surface-variant max-w-md mt-2">
                The diagnosis will appear here with suspected issue, confidence, remedies, prevention steps, and escalation guidance.
              </p>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-soft overflow-hidden">
            <div className="p-5 border-b border-outline-variant/30">
              <h2 className="text-[16px] font-bold text-on-surface">Diagnosis History</h2>
              <p className="text-[12px] text-on-surface-variant">Saved records for the selected field.</p>
            </div>
            <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-[14px] text-on-surface-variant text-center py-8">No diagnoses saved for this field yet.</p>
              ) : (
                history.map(item => (
                  <DiagnosisCard key={item.id} diagnosis={item} compact />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
