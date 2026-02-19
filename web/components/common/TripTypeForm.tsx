'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { Trash2, Plus } from 'lucide-react';

interface DistanceSlab {
  from: number;
  to: number;
  price: number;
}

interface TimeSlab {
  from: string;
  to: string;
  price: number;
}

interface TripTypeFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TripTypeForm = ({ initialData, onSubmit, onCancel, isLoading }: TripTypeFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    carCategory: initialData?.carCategory || 'NORMAL',
    type: initialData?.type || 'TIME',
    baseAmount: initialData?.baseAmount || 0,
    baseHour: initialData?.baseHour || null,
    baseDistance: initialData?.baseDistance || null,
    extraPerHour: initialData?.extraPerHour || null,
    extraPerHalfHour: initialData?.extraPerHalfHour || null,
    extraPerDistance: initialData?.extraPerDistance || null,
    slabType: initialData?.slabType || 'distance',
    distanceSlab: initialData?.distanceSlab || [{ from: 0, to: 0, price: 0 }],
    timeSlab: initialData?.timeSlab || [{ from: '00:00', to: '00:00', price: 0 }],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        carCategory: initialData.carCategory || 'NORMAL',
        type: initialData.type || 'TIME',
        baseAmount: initialData.baseAmount || 0,
        baseHour: initialData.baseHour || null,
        baseDistance: initialData.baseDistance || null,
        extraPerHour: initialData.extraPerHour || null,
        extraPerHalfHour: initialData.extraPerHalfHour || null,
        extraPerDistance: initialData.extraPerDistance || null,
        slabType: initialData.slabType || 'distance',
        distanceSlab: initialData.distanceSlab || [{ from: 0, to: 0, price: 0 }],
        timeSlab: initialData.timeSlab || [{ from: '00:00', to: '00:00', price: 0 }],
      });
    }
  }, [initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSlabChange = (index: number, field: keyof DistanceSlab | keyof TimeSlab, value: any, slabType: 'distance' | 'time') => {
    if (slabType === 'distance') {
      const updatedSlabs = [...formData.distanceSlab];
      (updatedSlabs[index] as any)[field] = value;
      setFormData(prev => ({
        ...prev,
        distanceSlab: updatedSlabs
      }));
    } else {
      const updatedSlabs = [...formData.timeSlab];
      (updatedSlabs[index] as any)[field] = value;
      setFormData(prev => ({
        ...prev,
        timeSlab: updatedSlabs
      }));
    }
  };

  const addSlabRow = (slabType: 'distance' | 'time') => {
    if (slabType === 'distance') {
      setFormData(prev => ({
        ...prev,
        distanceSlab: [...prev.distanceSlab, { from: 0, to: 0, price: 0 }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        timeSlab: [...prev.timeSlab, { from: '00:00', to: '00:00', price: 0 }]
      }));
    }
  };

  const removeSlabRow = (index: number, slabType: 'distance' | 'time') => {
    if (slabType === 'distance') {
      if (formData.distanceSlab.length > 1) {
        const updatedSlabs = [...formData.distanceSlab];
        updatedSlabs.splice(index, 1);
        setFormData(prev => ({
          ...prev,
          distanceSlab: updatedSlabs
        }));
      }
    } else {
      if (formData.timeSlab.length > 1) {
        const updatedSlabs = [...formData.timeSlab];
        updatedSlabs.splice(index, 1);
        setFormData(prev => ({
          ...prev,
          timeSlab: updatedSlabs
        }));
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.baseAmount < 0) {
      newErrors.baseAmount = 'Base amount must be non-negative';
    }

    if (formData.type === 'TIME') {
      if (formData.baseHour === null || formData.baseHour < 0) {
        newErrors.baseHour = 'Base hour is required for TIME type';
      }
      if (formData.extraPerHour === null || formData.extraPerHour < 0) {
        newErrors.extraPerHour = 'Extra per hour is required for TIME type';
      }
      if (formData.extraPerHalfHour === null || formData.extraPerHalfHour < 0) {
        newErrors.extraPerHalfHour = 'Extra per half hour is required for TIME type';
      }
      // Optional fields - only validate if provided
      if (formData.baseDistance !== null && formData.baseDistance < 0) {
        newErrors.baseDistance = 'Base distance must be non-negative';
      }
      if (formData.extraPerDistance !== null && formData.extraPerDistance < 0) {
        newErrors.extraPerDistance = 'Extra per distance must be non-negative';
      }
    } else if (formData.type === 'DISTANCE') {
      if (formData.baseDistance === null || formData.baseDistance < 0) {
        newErrors.baseDistance = 'Base distance is required for DISTANCE type';
      }
      if (formData.extraPerDistance === null || formData.extraPerDistance < 0) {
        newErrors.extraPerDistance = 'Extra per distance is required for DISTANCE type';
      }
    } else if (formData.type === 'SLAB') {
      if (formData.slabType === 'distance') {
        if (!formData.distanceSlab || formData.distanceSlab.length === 0) {
          newErrors.distanceSlab = 'At least one distance slab is required for SLAB type';
        } else {
          formData.distanceSlab.forEach((slab: DistanceSlab, index: number) => {
            if (slab.from < 0) {
              newErrors[`distanceSlab-${index}-from`] = 'From must be non-negative';
            }
            if (slab.to < slab.from) {
              newErrors[`distanceSlab-${index}-to`] = 'To must be greater than or equal to From';
            }
            if (slab.price < 0) {
              newErrors[`distanceSlab-${index}-price`] = 'Price must be non-negative';
            }
          });
        }
      } else {
        if (!formData.timeSlab || formData.timeSlab.length === 0) {
          newErrors.timeSlab = 'At least one time slab is required for SLAB type';
        } else {
          formData.timeSlab.forEach((slab: TimeSlab, index: number) => {
            if (!slab.from.match(/^\d{2}:\d{2}$/)) {
              newErrors[`timeSlab-${index}-from`] = 'From must be in HH:MM format';
            }
            if (!slab.to.match(/^\d{2}:\d{2}$/)) {
              newErrors[`timeSlab-${index}-to`] = 'To must be in HH:MM format';
            }
            if (slab.price < 0) {
              newErrors[`timeSlab-${index}-price`] = 'Price must be non-negative';
            }
          });
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <style jsx global>{`
        /* Hide number input spinners */
        input[type='number']::-webkit-outer-spin-button,
        input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
      {/* Card-like container */}
      <div className="border border-gray-800 bg-gray-900/50 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-white">{initialData ? 'Edit Trip Type' : 'Create Trip Type'}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-300">Name *</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter trip type name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label htmlFor="carCategory" className="block text-sm font-medium mb-1 text-gray-300">Car Category *</label>
              <select 
                id="carCategory"
                value={formData.carCategory} 
                onChange={(e) => handleChange('carCategory', e.target.value)}
                className="w-full border border-gray-700 bg-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="PREMIUM">Premium</option>
                <option value="LUXURY">Luxury</option>
                <option value="SPORTS">Sports</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1 text-gray-300">Description</label>
            <TextArea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter trip type description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1 text-gray-300">Type *</label>
              <select 
                id="type"
                value={formData.type} 
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full border border-gray-700 bg-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TIME">Time-Based</option>
                <option value="DISTANCE">Distance-Based</option>
                <option value="SLAB">Slab-Based</option>
              </select>
            </div>

            <div>
              <label htmlFor="baseAmount" className="block text-sm font-medium mb-1 text-gray-300">Base Amount *</label>
              <Input
                id="baseAmount"
                type="number"
                value={formData.baseAmount}
                onChange={(e) => handleChange('baseAmount', Number(e.target.value))}
                placeholder="Enter base amount"
              />
              {errors.baseAmount && <p className="text-red-500 text-sm mt-1">{errors.baseAmount}</p>}
            </div>
          </div>

          {formData.type === 'TIME' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="baseHour" className="block text-sm font-medium mb-1 text-gray-300">Base Hour *</label>
                  <Input
                    id="baseHour"
                    type="number"
                    value={formData.baseHour || ''}
                    onChange={(e) => handleChange('baseHour', Number(e.target.value))}
                    placeholder="Enter base hour"
                  />
                  {errors.baseHour && <p className="text-red-500 text-sm mt-1">{errors.baseHour}</p>}
                </div>
                
                <div>
                  <label htmlFor="baseDistance" className="block text-sm font-medium mb-1 text-gray-300">Base Distance (km)</label>
                  <Input
                    id="baseDistance"
                    type="number"
                    value={formData.baseDistance || ''}
                    onChange={(e) => handleChange('baseDistance', Number(e.target.value))}
                    placeholder="Enter base distance (optional)"
                  />
                </div>
                
                <div>
                  <label htmlFor="extraPerDistance" className="block text-sm font-medium mb-1 text-gray-300">Extra Per Distance (₹/km)</label>
                  <Input
                    id="extraPerDistance"
                    type="number"
                    value={formData.extraPerDistance || ''}
                    onChange={(e) => handleChange('extraPerDistance', Number(e.target.value))}
                    placeholder="Enter extra per distance (optional)"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="extraPerHour" className="block text-sm font-medium mb-1 text-gray-300">Extra Per Hour *</label>
                  <Input
                    id="extraPerHour"
                    type="number"
                    value={formData.extraPerHour || ''}
                    onChange={(e) => handleChange('extraPerHour', Number(e.target.value))}
                    placeholder="Enter extra per hour"
                  />
                  {errors.extraPerHour && <p className="text-red-500 text-sm mt-1">{errors.extraPerHour}</p>}
                </div>
                
                <div>
                  <label htmlFor="extraPerHalfHour" className="block text-sm font-medium mb-1 text-gray-300">Extra Per Half Hour *</label>
                  <Input
                    id="extraPerHalfHour"
                    type="number"
                    value={formData.extraPerHalfHour || ''}
                    onChange={(e) => handleChange('extraPerHalfHour', Number(e.target.value))}
                    placeholder="Enter extra per half hour"
                  />
                  {errors.extraPerHalfHour && <p className="text-red-500 text-sm mt-1">{errors.extraPerHalfHour}</p>}
                </div>
              </div>
            </>
          )}

          {formData.type === 'DISTANCE' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="baseDistance" className="block text-sm font-medium mb-1 text-gray-300">Base Distance *</label>
                <Input
                  id="baseDistance"
                  type="number"
                  value={formData.baseDistance || ''}
                  onChange={(e) => handleChange('baseDistance', Number(e.target.value))}
                  placeholder="Enter base distance (km)"
                />
                {errors.baseDistance && <p className="text-red-500 text-sm mt-1">{errors.baseDistance}</p>}
              </div>
              
              <div>
                <label htmlFor="extraPerDistance" className="block text-sm font-medium mb-1 text-gray-300">Extra Per Distance *</label>
                <Input
                  id="extraPerDistance"
                  type="number"
                  value={formData.extraPerDistance || ''}
                  onChange={(e) => handleChange('extraPerDistance', Number(e.target.value))}
                  placeholder="Enter extra per distance (per km)"
                />
                {errors.extraPerDistance && <p className="text-red-500 text-sm mt-1">{errors.extraPerDistance}</p>}
              </div>
            </div>
          )}

          {formData.type === 'SLAB' && (
            <div>
              <label htmlFor="slabType" className="block text-sm font-medium mb-1 text-gray-300">Slab Type *</label>
              <select 
                id="slabType"
                value={formData.slabType} 
                onChange={(e) => handleChange('slabType', e.target.value)}
                className="w-full border border-gray-700 bg-gray-800 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="distance">Distance Slab</option>
                <option value="time">Time Slab</option>
              </select>
              
              {formData.slabType === 'distance' && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-white">Distance Slabs</h3>
                    <Button 
                      type="button" 
                      size="small" 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => addSlabRow('distance')}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </Button>
                  </div>
                  
                  {formData.distanceSlab.map((slab: DistanceSlab, index: number) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                      <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1 text-gray-300">From (km)</label>
                        <Input
                          type="number"
                          value={slab.from}
                          onChange={(e) => handleSlabChange(index, 'from', Number(e.target.value), 'distance')}
                          placeholder="From"
                        />
                        {errors[`distanceSlab-${index}-from`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`distanceSlab-${index}-from`]}</p>
                        )}
                      </div>
                      
                      <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1 text-gray-300">To (km)</label>
                        <Input
                          type="number"
                          value={slab.to}
                          onChange={(e) => handleSlabChange(index, 'to', Number(e.target.value), 'distance')}
                          placeholder="To"
                        />
                        {errors[`distanceSlab-${index}-to`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`distanceSlab-${index}-to`]}</p>
                        )}
                      </div>
                      
                      <div className="col-span-3">
                        <label className="block text-sm font-medium mb-1 text-gray-300">Price (₹)</label>
                        <Input
                          type="number"
                          value={slab.price}
                          onChange={(e) => handleSlabChange(index, 'price', Number(e.target.value), 'distance')}
                          placeholder="Price"
                        />
                        {errors[`distanceSlab-${index}-price`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`distanceSlab-${index}-price`]}</p>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="outlined" 
                          size="small"
                          color="error"
                          onClick={() => removeSlabRow(index, 'distance')}
                          disabled={formData.distanceSlab.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {errors.distanceSlab && (
                    <p className="text-red-500 text-sm mt-1">{errors.distanceSlab}</p>
                  )}
                </div>
              )}
              
              {formData.slabType === 'time' && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-white">Time Slabs</h3>
                    <Button 
                      type="button" 
                      size="small" 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => addSlabRow('time')}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Row
                    </Button>
                  </div>
                  
                  {formData.timeSlab.map((slab: TimeSlab, index: number) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                      <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1 text-gray-300">From (HH:MM)</label>
                        <Input
                          type="text"
                          value={slab.from}
                          onChange={(e) => handleSlabChange(index, 'from', e.target.value, 'time')}
                          placeholder="HH:MM"
                        />
                        {errors[`timeSlab-${index}-from`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`timeSlab-${index}-from`]}</p>
                        )}
                      </div>
                      
                      <div className="col-span-4">
                        <label className="block text-sm font-medium mb-1">To (HH:MM)</label>
                        <Input
                          type="text"
                          value={slab.to}
                          onChange={(e) => handleSlabChange(index, 'to', e.target.value, 'time')}
                          placeholder="HH:MM"
                        />
                        {errors[`timeSlab-${index}-to`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`timeSlab-${index}-to`]}</p>
                        )}
                      </div>
                      
                      <div className="col-span-3">
                        <label className="block text-sm font-medium mb-1 text-gray-300">Price (₹)</label>
                        <Input
                          type="number"
                          value={slab.price}
                          onChange={(e) => handleSlabChange(index, 'price', Number(e.target.value), 'time')}
                          placeholder="Price"
                        />
                        {errors[`timeSlab-${index}-price`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`timeSlab-${index}-price`]}</p>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="outlined" 
                          size="small"
                          color="error"
                          onClick={() => removeSlabRow(index, 'time')}
                          disabled={formData.timeSlab.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {errors.timeSlab && (
                    <p className="text-red-500 text-sm mt-1">{errors.timeSlab}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outlined" color="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
        </Button>
      </div>
    </form>
  );
};

export default TripTypeForm;