import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import { employeeApi, rbacApi } from '../../lib/api.js';
import { useAuth } from '../../context/useAuth.js';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

const createEmployeeSchema = z.object({
  ecode: z
    .string()
    .trim()
    .min(2, 'Employee code must be at least 2 characters.')
    .max(20, 'Employee code must not exceed 20 characters.')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(100, 'Full name must not exceed 100 characters.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid corporate email.')
    .max(150, 'Email must not exceed 150 characters.')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .optional()
    .default('Welcome@Detector2026!'),
});

export function AddEmployeeModal({ isOpen, onClose, onCreated }) {
  const { hasPermission } = useAuth();
  const canAssignAdmin = hasPermission('CORE.ROLE.ASSIGN_ADMIN');

  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState(['PROJECT_MANAGER']);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      ecode: '',
      name: '',
      email: '',
      password: 'Welcome@Detector2026!',
    },
  });

  const handleClose = () => {
    setSubmitError(null);
    setSelectedRoles(['PROJECT_MANAGER']);
    reset({
      ecode: '',
      name: '',
      email: '',
      password: 'Welcome@Detector2026!',
    });
    onClose();
  };

  // Load assignable roles when modal opens
  useEffect(() => {
    if (!isOpen) return;

    rbacApi
      .getRoles()
      .then((data) => {
        if (Array.isArray(data?.roles)) {
          setAvailableRoles(data.roles);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch assignable roles:', err.message);
      });
  }, [isOpen]);

  const handleRoleToggle = (roleCode) => {
    setSelectedRoles((prev) =>
      prev.includes(roleCode)
        ? prev.filter((code) => code !== roleCode)
        : [...prev, roleCode]
    );
  };

  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await employeeApi.create({
        ecode: data.ecode,
        name: data.name,
        email: data.email,
        password: data.password || 'Welcome@Detector2026!',
        role_codes: selectedRoles,
      });

      if (onCreated) {
        onCreated(data.ecode);
      }
      handleClose();
    } catch (err) {
      setSubmitError(err.message || 'Failed to create employee profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const platformRoles = availableRoles.filter(
    (r) => r.role_category === 'PLATFORM_ADMIN' || r.role_category === 'MODULE_ADMIN'
  );
  const orgRoles = availableRoles.filter(
    (r) => r.role_category === 'ORGANIZATIONAL'
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Employee">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          label="Employee Code *"
          id="ecode"
          placeholder="e.g. E1010"
          error={errors.ecode?.message}
          disabled={isSubmitting}
          {...register('ecode')}
        />

        <Input
          label="Full Name *"
          id="name"
          placeholder="e.g. John Smith"
          error={errors.name?.message}
          disabled={isSubmitting}
          {...register('name')}
        />

        <Input
          label="Corporate Email *"
          id="email"
          type="email"
          placeholder="e.g. john@company.com"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register('email')}
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="password">
            Initial Password
          </label>
          <input
            id="password"
            type="text"
            className="block w-full rounded-lg bg-surface-container-low px-3.5 py-2 text-xs font-mono text-on-surface-variant border border-outline-variant/60 cursor-not-allowed"
            disabled
            value="Welcome@Detector2026!"
          />
          <p className="text-[11px] text-on-surface-variant">Default password assigned automatically</p>
        </div>

        {/* Roles Selection */}
        <div className="space-y-2 pt-1 text-left">
          <label className="block text-xs font-semibold text-on-surface">
            Initial Role Assignments
          </label>
          <div className="border border-outline-variant/30 rounded-lg p-3 bg-surface-container-low/40 space-y-3">
            {platformRoles.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5 font-mono">
                  Administrative Roles
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {platformRoles.map((role) => (
                    <label
                      key={role.role_code}
                      className={`font-mono text-xs flex items-center gap-2 cursor-pointer ${
                        !canAssignAdmin ? 'opacity-50 cursor-not-allowed' : 'text-on-surface'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.role_code)}
                        onChange={() => handleRoleToggle(role.role_code)}
                        disabled={!canAssignAdmin || isSubmitting}
                        className="rounded text-primary focus:ring-primary border-outline-variant"
                      />
                      <span>{role.role_code}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {platformRoles.length > 0 && orgRoles.length > 0 && (
              <div className="border-t border-outline-variant/30 my-2"></div>
            )}

            {orgRoles.length > 0 && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-outline mb-1.5 font-mono">
                  Organizational Roles
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {orgRoles.map((role) => (
                    <label
                      key={role.role_code}
                      className="font-mono text-xs text-on-surface flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.role_code)}
                        onChange={() => handleRoleToggle(role.role_code)}
                        disabled={isSubmitting}
                        className="rounded text-primary focus:ring-primary border-outline-variant"
                      />
                      <span>{role.role_code}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
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
            icon={isSubmitting ? Loader2 : UserPlus}
          >
            {isSubmitting ? 'Creating...' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AddEmployeeModal;
