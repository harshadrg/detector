import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { processApi, masterApi, employeeApi } from '../../lib/api.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

const createProcessSchema = z.object({
  vertical_id: z.coerce.number().int().positive('Please select a Vertical.'),
  sbu_id: z.coerce.number().int().positive().optional().nullable(),
  process_name: z
    .string()
    .trim()
    .min(3, 'Process name must be at least 3 characters.')
    .max(150, 'Process name must not exceed 150 characters.'),
  wps_code: z.string().trim().max(50).optional().nullable(),
  client_id: z.coerce.number().int().positive().optional().nullable(),
  client_type: z.enum(['DOMESTIC', 'INTERNATIONAL']).default('DOMESTIC'),
  status: z.enum(['ACTIVE', 'TRANSITION', 'DRAFT']).default('TRANSITION'),
  started_on: z.string().optional().nullable(),
  
  ops_head_ecode: z.string().trim().optional().nullable(),
  cbo_ecode: z.string().trim().optional().nullable(),
  sbu_head_ecode: z.string().trim().optional().nullable(),
  account_head_ecode: z.string().trim().optional().nullable(),
  pm_ecode: z.string().trim().optional().nullable(),
});

function EmployeeSelect({ roleCode, id, label, register, disabled }) {
  const [employees, setEmployees] = useState([]);
  
  useEffect(() => {
    employeeApi.list({ page: 1, pageSize: 100, status: 'ACTIVE', role_code: roleCode })
      .then(data => {
        if (Array.isArray(data?.employees)) {
          setEmployees(data.employees);
        }
      })
      .catch(console.warn);
  }, [roleCode]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-on-surface" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
        disabled={disabled}
        {...register(id)}
      >
        <option value="">Select {label} (Optional)...</option>
        {employees.map((emp) => (
          <option key={emp.ecode} value={emp.ecode}>
            {emp.ecode} — {emp.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RegisterProcessModal({ isOpen, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);

  const [masters, setMasters] = useState({ verticals: [], sbus: [], clients: [] });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createProcessSchema),
    defaultValues: {
      vertical_id: '',
      sbu_id: '',
      process_name: '',
      wps_code: '',
      client_id: '',
      client_type: 'DOMESTIC',
      status: 'TRANSITION',
      started_on: '',
      
      ops_head_ecode: '',
      cbo_ecode: '',
      sbu_head_ecode: '',
      account_head_ecode: '',
      pm_ecode: '',
    },
    mode: 'onTouched',
  });

  const [selectedVerticalId, setSelectedVerticalId] = useState('');

  const handleClose = () => {
    setSubmitError(null);
    setSelectedVerticalId('');
    setStep(1);
    setFormData(null);
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    masterApi
      .getAll()
      .then((data) => {
        if (data) {
          setMasters({
            verticals: data.verticals || [],
            sbus: data.sbus || [],
            clients: data.clients || [],
          });
        }
      })
      .catch((err) => {
        console.warn('Could not load master data:', err.message);
      });
  }, [isOpen]);

  const filteredSBUs = selectedVerticalId
    ? masters.sbus.filter((s) => String(s.vertical_id) === String(selectedVerticalId))
    : masters.sbus;

  const onProceed = (data) => {
    setFormData(data);
    setStep(2);
  };

  const onSubmitFinal = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const data = formData;
      const payload = {
        vertical_id: Number(data.vertical_id),
        sbu_id: data.sbu_id ? Number(data.sbu_id) : null,
        process_name: data.process_name.trim(),
        wps_code: data.wps_code?.trim() || null,
        client_id: data.client_id ? Number(data.client_id) : null,
        client_type: data.client_type || 'DOMESTIC',
        status: data.status || 'TRANSITION',
        started_on: data.started_on || null,
        
        ops_head_ecode: data.ops_head_ecode?.trim() || null,
        cbo_ecode: data.cbo_ecode?.trim() || null,
        sbu_head_ecode: data.sbu_head_ecode?.trim() || null,
        account_head_ecode: data.account_head_ecode?.trim() || null,
        pm_ecode: data.pm_ecode?.trim() || null,
      };

      const result = await processApi.create(payload);
      if (onCreated) {
        onCreated(result?.process);
      }
      handleClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to register process.');
      setStep(1); // Go back to form to fix errors
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register New Process">
      {submitError && (
        <div
          role="alert"
          className="p-3 mb-4 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-2.5 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{submitError}</div>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSubmit(onProceed)} className="space-y-4 text-left">
          <Input
            label="Process Name *"
            id="process_name"
            placeholder="e.g. Payment Gateway Operations"
            error={errors.process_name?.message}
            disabled={isSubmitting}
            {...register('process_name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="vertical_id">
                Vertical *
              </label>
              <select
                id="vertical_id"
                className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={isSubmitting}
                {...register('vertical_id', {
                  onChange: (e) => setSelectedVerticalId(e.target.value),
                })}
              >
                <option value="">Select Vertical...</option>
                {masters.verticals.map((v) => (
                  <option key={v.vertical_id} value={v.vertical_id}>
                    {v.vertical_code} — {v.vertical_name}
                  </option>
                ))}
              </select>
              {errors.vertical_id && (
                <p className="text-[11px] text-error font-medium">{errors.vertical_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="sbu_id">
                SBU
              </label>
              <select
                id="sbu_id"
                className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={isSubmitting}
                {...register('sbu_id')}
              >
                <option value="">Select SBU (Optional)...</option>
                {filteredSBUs.map((s) => (
                  <option key={s.sbu_id} value={s.sbu_id}>
                    {s.sbu_code} — {s.sbu_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="client_id">
                Client
              </label>
              <select
                id="client_id"
                className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={isSubmitting}
                {...register('client_id')}
              >
                <option value="">Select Client (Optional)...</option>
                {masters.clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.client_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="client_type">
                Client Type
              </label>
              <select
                id="client_type"
                className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={isSubmitting}
                {...register('client_type')}
              >
                <option value="DOMESTIC">DOMESTIC</option>
                <option value="INTERNATIONAL">INTERNATIONAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="WPS Code"
              id="wps_code"
              placeholder="e.g. WPS-BFSI-001"
              disabled={isSubmitting}
              {...register('wps_code')}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="status">
                Initial Status
              </label>
              <select
                id="status"
                className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={isSubmitting}
                {...register('status')}
              >
                <option value="TRANSITION">TRANSITION</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5 w-full sm:w-1/2 sm:pr-1.5">
              <label className="block text-xs font-semibold text-on-surface" htmlFor="started_on">
                Go-Live / Start Date
              </label>
              <input
                id="started_on"
                type="date"
                className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                disabled={isSubmitting}
                {...register('started_on')}
              />
            </div>
          </div>

          {/* Ownership Hierarchy */}
          <div className="pt-2 border-t border-outline-variant/20 mt-4">
            <h3 className="text-sm font-semibold text-on-surface mb-3">Ownership Hierarchy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EmployeeSelect roleCode="OPS_QUALITY_HEAD" id="ops_head_ecode" label="OPS Quality Head" register={register} disabled={isSubmitting} />
              <EmployeeSelect roleCode="CBO" id="cbo_ecode" label="CBO" register={register} disabled={isSubmitting} />
              <EmployeeSelect roleCode="SBU_HEAD" id="sbu_head_ecode" label="SBU Head" register={register} disabled={isSubmitting} />
              <EmployeeSelect roleCode="ACCOUNT_HEAD" id="account_head_ecode" label="Account Head" register={register} disabled={isSubmitting} />
              <EmployeeSelect roleCode="PM" id="pm_ecode" label="Project Manager" register={register} disabled={isSubmitting} />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              Next <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && formData && (
        <div className="space-y-4 text-left">
          <div className="bg-surface-container-low rounded-lg p-4 text-sm border border-outline-variant/30 space-y-3">
            <h3 className="font-semibold text-on-surface border-b border-outline-variant/20 pb-2 mb-2">Process Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-on-surface-variant font-medium">Process Name:</div>
              <div className="text-on-surface font-semibold">{formData.process_name}</div>
              
              <div className="text-on-surface-variant font-medium">Vertical / SBU:</div>
              <div className="text-on-surface">
                {masters.verticals.find(v => String(v.vertical_id) === String(formData.vertical_id))?.vertical_code || formData.vertical_id} 
                {formData.sbu_id ? ` / ${masters.sbus.find(s => String(s.sbu_id) === String(formData.sbu_id))?.sbu_code || formData.sbu_id}` : ''}
              </div>

              <div className="text-on-surface-variant font-medium">Client:</div>
              <div className="text-on-surface">
                {formData.client_id ? (masters.clients.find(c => String(c.client_id) === String(formData.client_id))?.client_name || formData.client_id) : 'None'} ({formData.client_type})
              </div>

              <div className="text-on-surface-variant font-medium">Status:</div>
              <div className="text-on-surface">{formData.status}</div>
            </div>

            <h3 className="font-semibold text-on-surface border-b border-outline-variant/20 pb-2 mt-4 mb-2 pt-2">Ownership Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-on-surface-variant font-medium">OPS Quality Head:</div>
              <div className="text-on-surface">{formData.ops_head_ecode || 'Unassigned'}</div>
              
              <div className="text-on-surface-variant font-medium">CBO:</div>
              <div className="text-on-surface">{formData.cbo_ecode || 'Unassigned'}</div>
              
              <div className="text-on-surface-variant font-medium">SBU Head:</div>
              <div className="text-on-surface">{formData.sbu_head_ecode || 'Unassigned'}</div>
              
              <div className="text-on-surface-variant font-medium">Account Head:</div>
              <div className="text-on-surface">{formData.account_head_ecode || 'Unassigned'}</div>
              
              <div className="text-on-surface-variant font-medium">Project Manager:</div>
              <div className="text-on-surface">{formData.pm_ecode || 'Unassigned'}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onSubmitFinal}
              disabled={isSubmitting}
              icon={isSubmitting ? Loader2 : PlusCircle}
            >
              {isSubmitting ? 'Registering...' : 'Confirm & Register'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default RegisterProcessModal;
