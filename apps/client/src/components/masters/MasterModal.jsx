import { useState } from 'react';
import { masterApi } from '../../lib/api.js';
import { X, Layers, Briefcase, Building2, MapPin, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORY_ICONS = {
  VERTICAL: Layers,
  SBU: Briefcase,
  CLIENT: Building2,
  LOCATION: MapPin,
};

export function MasterModal({ isOpen, onClose, category, item, verticals = [], onSuccess }) {
  const isEdit = !!item;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Initialized directly with lazy state functions — no synchronous effect needed
  const [code, setCode] = useState(() => item?.vertical_code || item?.sbu_code || '');
  const [name, setName] = useState(
    () => item?.vertical_name || item?.sbu_name || item?.client_name || ''
  );
  const [verticalId, setVerticalId] = useState(() =>
    item?.vertical_id ? String(item.vertical_id) : verticals[0]?.vertical_id ? String(verticals[0].vertical_id) : ''
  );
  const [clientType, setClientType] = useState(() => item?.client_type || 'DOMESTIC');
  const [stateName, setStateName] = useState(() => item?.state || '');
  const [cityName, setCityName] = useState(() => item?.city || '');
  const [facilityName, setFacilityName] = useState(() => item?.facility_name || '');
  const [isActive, setIsActive] = useState(() => (item ? item.is_active !== false : true));

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsSubmitting(true);

    try {
      if (category === 'VERTICAL') {
        if (isEdit) {
          await masterApi.updateVertical(item.vertical_id, {
            vertical_name: name,
            is_active: isActive,
          });
        } else {
          await masterApi.createVertical({
            vertical_code: code,
            vertical_name: name,
          });
        }
      } else if (category === 'SBU') {
        if (isEdit) {
          await masterApi.updateSBU(item.sbu_id, {
            sbu_name: name,
            vertical_id: verticalId,
            is_active: isActive,
          });
        } else {
          await masterApi.createSBU({
            sbu_code: code,
            sbu_name: name,
            vertical_id: verticalId,
          });
        }
      } else if (category === 'CLIENT') {
        if (isEdit) {
          await masterApi.updateClient(item.client_id, {
            client_name: name,
            client_type: clientType,
            is_active: isActive,
          });
        } else {
          await masterApi.createClient({
            client_name: name,
            client_type: clientType,
          });
        }
      } else if (category === 'LOCATION') {
        if (isEdit) {
          await masterApi.updateLocation(item.location_id, {
            state: stateName,
            city: cityName,
            facility_name: facilityName,
          });
        } else {
          await masterApi.createLocation({
            state: stateName,
            city: cityName,
            facility_name: facilityName,
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      setServerError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    const action = isEdit ? 'Edit' : 'Add New';
    switch (category) {
      case 'VERTICAL':
        return `${action} Business Vertical`;
      case 'SBU':
        return `${action} Strategic Business Unit (SBU)`;
      case 'CLIENT':
        return `${action} Enterprise Client`;
      case 'LOCATION':
        return `${action} Delivery Facility Location`;
      default:
        return `${action} Master Record`;
    }
  };

  const Icon = CATEGORY_ICONS[category] || Layers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{getTitle()}</h3>
              <p className="text-[11px] text-slate-500">
                {isEdit ? 'Update existing master catalog entry' : 'Create new verified master record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* VERTICAL FORM */}
          {category === 'VERTICAL' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vertical Code
                </label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. BFSI"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vertical Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Banking, Financial Services & Insurance"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {isEdit && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="vertical_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="vertical_active" className="text-xs text-slate-700 font-medium">
                    Active Catalog Status
                  </label>
                </div>
              )}
            </>
          )}

          {/* SBU FORM */}
          {category === 'SBU' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SBU Code
                </label>
                <input
                  type="text"
                  required
                  disabled={isEdit}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MEU"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SBU Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Manufacturing & Energy Unit"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Business Vertical
                </label>
                <select
                  required
                  value={verticalId}
                  onChange={(e) => setVerticalId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {verticals.map((v) => (
                    <option key={v.vertical_id} value={v.vertical_id}>
                      {v.vertical_name} ({v.vertical_code})
                    </option>
                  ))}
                </select>
              </div>

              {isEdit && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="sbu_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="sbu_active" className="text-xs text-slate-700 font-medium">
                    Active Catalog Status
                  </label>
                </div>
              )}
            </>
          )}

          {/* CLIENT FORM */}
          {category === 'CLIENT' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Financial Services"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commercial Geography Type
                </label>
                <select
                  required
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="DOMESTIC">Domestic (DOMESTIC)</option>
                  <option value="INTERNATIONAL">International (INTERNATIONAL)</option>
                </select>
              </div>

              {isEdit && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="client_active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="client_active" className="text-xs text-slate-700 font-medium">
                    Active Catalog Status
                  </label>
                </div>
              )}
            </>
          )}

          {/* LOCATION FORM */}
          {category === 'LOCATION' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Territory
                </label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Facility / Campus Name
                </label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  placeholder="e.g. Mindspace Campus Tower A"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? 'Save Changes' : 'Create Record'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
