import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  pm_ecode: z.string().trim().optional().nullable(),
});

export function RegisterProcessModal({ isOpen, onClose, onCreated }) {
  const [masters, setMasters] = useState({ verticals: [], sbus: [], clients: [] });
  const [employees, setEmployees] = useState([]);
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
      pm_ecode: '',
    },
  });

  const [selectedVerticalId, setSelectedVerticalId] = useState('');

  const handleClose = () => {
    setSubmitError(null);
    setSelectedVerticalId('');
    reset();
    onClose();
  };

  // Load master data and PM candidates when modal opens
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

    employeeApi
      .list({ page: 1, pageSize: 100, status: 'ACTIVE' })
      .then((data) => {
        if (Array.isArray(data?.employees)) {
          setEmployees(data.employees);
        }
      })
      .catch((err) => {
        console.warn('Could not load employees:', err.message);
      });
  }, [isOpen]);

  const filteredSBUs = selectedVerticalId
    ? masters.sbus.filter((s) => String(s.vertical_id) === String(selectedVerticalId))
    : masters.sbus;

  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        vertical_id: Number(data.vertical_id),
        sbu_id: data.sbu_id ? Number(data.sbu_id) : null,
        process_name: data.process_name.trim(),
        wps_code: data.wps_code?.trim() || null,
        client_id: data.client_id ? Number(data.client_id) : null,
        client_type: data.client_type || 'DOMESTIC',
        status: data.status || 'TRANSITION',
        started_on: data.started_on || null,
        pm_ecode: data.pm_ecode?.trim() || null,
      };

      const result = await processApi.create(payload);
      if (onCreated) {
        onCreated(result?.process);
      }
      handleClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to register process.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register New Process">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {submitError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-error/10 border border-error/20 text-error flex items-start gap-2.5 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{submitError}</div>
          </div>
        )}

        <Input
          label="Process Name *"
          id="process_name"
          placeholder="e.g. Payment Gateway Operations"
          error={errors.process_name?.message}
          disabled={isSubmitting}
          {...register('process_name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Vertical Select */}
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

          {/* SBU Select */}
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
          {/* Client Select */}
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

          {/* Client Type */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
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

          {/* Initial Project Manager */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface" htmlFor="pm_ecode">
              Assigned Project Manager
            </label>
            <select
              id="pm_ecode"
              className="block w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-xs text-on-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              disabled={isSubmitting}
              {...register('pm_ecode')}
            >
              <option value="">Select PM (Optional)...</option>
              {employees.map((emp) => (
                <option key={emp.ecode} value={emp.ecode}>
                  {emp.ecode} — {emp.name}
                </option>
              ))}
            </select>
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
            icon={isSubmitting ? Loader2 : PlusCircle}
          >
            {isSubmitting ? 'Registering...' : 'Register Process'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RegisterProcessModal;
