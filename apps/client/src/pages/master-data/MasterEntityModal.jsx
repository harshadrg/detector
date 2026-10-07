import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { masterApi } from '../../lib/api';
import { X, Loader2 } from 'lucide-react';

const schemas = {
  VERTICALS: z.object({
    vertical_code: z.string().min(2, "Code is required").max(10),
    vertical_name: z.string().min(2, "Name is required").max(100),
    is_active: z.boolean(),
  }),
  SBUS: z.object({
    sbu_code: z.string().min(2, "Code is required").max(10),
    sbu_name: z.string().min(2, "Name is required").max(100),
    vertical_id: z.coerce.number().min(1, "Vertical is required"),
    is_active: z.boolean(),
  }),
  CLIENTS: z.object({
    client_name: z.string().min(2, "Name is required").max(150),
    client_type: z.enum(['INTERNAL', 'EXTERNAL']),
    is_active: z.boolean(),
  }),
  LOCATIONS: z.object({
    city: z.string().min(2, "City is required").max(100),
    state: z.string().min(2, "State is required").max(100),
    country: z.string().default('India'),
    is_active: z.boolean(),
  }),
};

export function MasterEntityModal({ isOpen, onClose, entityType, initialData, verticals }) {
  const [apiError, setApiError] = useState(null);
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const schema = schemas[entityType] || schemas.VERTICALS;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      is_active: true,
      country: 'India',
      client_type: 'EXTERNAL',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setApiError(null);
      if (initialData) {
        reset({
          ...initialData,
          is_active: initialData.is_active ?? true,
        });
      } else {
        reset({ is_active: true, country: 'India', client_type: 'EXTERNAL' });
      }
    }
  }, [isOpen, initialData, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      switch (entityType) {
        case 'VERTICALS':
          return isEditing ? masterApi.updateVertical(initialData.vertical_id, data) : masterApi.createVertical(data);
        case 'SBUS':
          return isEditing ? masterApi.updateSBU(initialData.sbu_id, data) : masterApi.createSBU(data);
        case 'CLIENTS':
          return isEditing ? masterApi.updateClient(initialData.client_id, data) : masterApi.createClient(data);
        case 'LOCATIONS':
          return isEditing ? masterApi.updateLocation(initialData.location_id, data) : masterApi.createLocation(data);
        default:
          throw new Error('Unknown entity type');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['master-' + entityType.toLowerCase()]);
      onClose();
    },
    onError: (error) => {
      setApiError(error.message || 'An error occurred while saving.');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md border border-outline-variant flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/50 bg-surface-container-lowest">
          <h2 className="text-lg font-headline font-semibold text-on-surface">
            {isEditing ? 'Edit' : 'Create'} {entityType.slice(0, -1)}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {apiError && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
              {apiError}
            </div>
          )}

          <form id="master-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {(entityType === 'VERTICALS' || entityType === 'SBUS') && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Code</label>
                <input
                  type="text"
                  {...register(entityType === 'VERTICALS' ? 'vertical_code' : 'sbu_code')}
                  disabled={isEditing}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  placeholder="e.g. IT"
                />
                {errors.vertical_code && <p className="text-error text-xs mt-1">{errors.vertical_code.message}</p>}
                {errors.sbu_code && <p className="text-error text-xs mt-1">{errors.sbu_code.message}</p>}
              </div>
            )}

            {(entityType === 'VERTICALS' || entityType === 'SBUS') && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Name</label>
                <input
                  type="text"
                  {...register(entityType === 'VERTICALS' ? 'vertical_name' : 'sbu_name')}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g. Information Technology"
                />
                {errors.vertical_name && <p className="text-error text-xs mt-1">{errors.vertical_name.message}</p>}
                {errors.sbu_name && <p className="text-error text-xs mt-1">{errors.sbu_name.message}</p>}
              </div>
            )}

            {entityType === 'SBUS' && (
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Vertical</label>
                <select
                  {...register('vertical_id')}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Select Vertical...</option>
                  {verticals.map(v => (
                    <option key={v.vertical_id} value={v.vertical_id}>{v.vertical_name}</option>
                  ))}
                </select>
                {errors.vertical_id && <p className="text-error text-xs mt-1">{errors.vertical_id.message}</p>}
              </div>
            )}

            {entityType === 'CLIENTS' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Client Name</label>
                  <input
                    type="text"
                    {...register('client_name')}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g. Acme Corp"
                  />
                  {errors.client_name && <p className="text-error text-xs mt-1">{errors.client_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
                  <select
                    {...register('client_type')}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="EXTERNAL">EXTERNAL</option>
                  </select>
                  {errors.client_type && <p className="text-error text-xs mt-1">{errors.client_type.message}</p>}
                </div>
              </>
            )}

            {entityType === 'LOCATIONS' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">City</label>
                  <input
                    type="text"
                    {...register('city')}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.city && <p className="text-error text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">State</label>
                  <input
                    type="text"
                    {...register('state')}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.state && <p className="text-error text-xs mt-1">{errors.state.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Country</label>
                  <input
                    type="text"
                    {...register('country')}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.country && <p className="text-error text-xs mt-1">{errors.country.message}</p>}
                </div>
              </>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="w-4 h-4 text-primary bg-surface-container-lowest border-outline rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-on-surface">
                Active Entity
              </label>
            </div>

            {/* Password confirmation for deactivation */}
            {/* eslint-disable-next-line react-hooks/incompatible-library */}
            {isEditing && initialData?.is_active === true && !watch('is_active') && (
              <div className="mt-4 p-4 bg-error-container/20 border border-error-container rounded-lg">
                <label className="block text-sm font-medium text-error mb-1">
                  Password Required to Deactivate
                </label>
                <input
                  type="password"
                  required
                  {...register('password')}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-error/50 rounded-lg text-sm focus:ring-2 focus:ring-error focus:border-error"
                  placeholder="Enter your password to confirm"
                />
                <p className="text-error text-xs mt-1 font-medium">Deactivating this entity is a high-risk action.</p>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/50 bg-surface-container-lowest flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="master-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold bg-primary text-on-primary hover:bg-primary-dim rounded-lg shadow-sm flex items-center justify-center min-w-[100px] transition-colors disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  );
}
