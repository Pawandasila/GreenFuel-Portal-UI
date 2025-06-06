'use client'
import React, { useState } from 'react';
import { FolderOpen, Settings, BriefcaseIcon, Plus, AlertCircle, CheckCircle, Search, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BusinessUnit, BusinessUnitActionsProps, Department } from './types';
import { DepartmentItem } from './DepartmentItem';
import { createDepartment, createDesignation, updateDepartment, deleteDepartment } from './api';
import useAxios from '@/app/hooks/use-axios';
import { toast } from '@/lib/toast-util';

interface DepartmentsTabProps extends BusinessUnitActionsProps {
  selectedDepartmentId: string;
  setSelectedDepartmentId: React.Dispatch<React.SetStateAction<string>>;
  setIsAddDesignationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = ({
  businessUnits,
  setBusinessUnits,
  activeBusinessUnitId,
  setActiveBusinessUnitId,
  setActiveTab,
  selectedDepartmentId,
  setSelectedDepartmentId,
  setIsAddDesignationDialogOpen,
}) => {
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDesignationName, setNewDesignationName] = useState('');
  const [isAddingDesignation, setIsAddingDesignation] = useState(false);
  const api = useAxios();

  const activeBusinessUnit = businessUnits.find(bu => bu.id === activeBusinessUnitId) || null;

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim() || !activeBusinessUnitId) return;
    
    setIsLoading(true);
    
    try {
      const newDepartment = await createDepartment(api, {
        name: newDepartmentName,
        business_unit: Number(activeBusinessUnitId)
      });
      
      const updatedBusinessUnits = businessUnits.map(bu => {
        if (bu.id === activeBusinessUnitId) {
          return {
            ...bu,
            departments: [...(bu.departments || []), newDepartment],
          };
        }
        return bu;
      });
      
      setBusinessUnits(updatedBusinessUnits);
      setNewDepartmentName('');
      toast.success('Department added successfully');
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to create department');
    } finally {
      setIsLoading(false);
    }
  };

  const validateDepartment = () => {
    if (!activeBusinessUnit || !selectedDepartmentId) return;
    
    const currentDepartment = activeBusinessUnit.departments?.find(
      d => d.id?.toString() === selectedDepartmentId
    );
    
    if (!currentDepartment) {
      setValidationMessage({
        message: "Department not found",
        type: "error"
      });
      return;
    }
    
    const designations = currentDepartment.designations || [];
    
    if (designations.length === 0) {
      setValidationMessage({
        message: "No designations found. Please add at least one designation.",
        type: "warning"
      });
      return;
    }
    
    setValidationMessage({
      message: "Validation successful! The department has designations configured.",
      type: "success"
    });
  };

  const filteredDepartments = activeBusinessUnit?.departments?.filter(
    department => department.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];


  return (
    <div className="space-y-2">
      {activeBusinessUnit && (
        <div className="flex items-center">
          <Badge className="px-3 py-1 bg-green-50 text-green-700 border border-green-200">
            {activeBusinessUnit.name}
          </Badge>
          <span className="mx-2 text-gray-400">•</span>
          <Badge className="text-xs text-green-700 bg-green-50 border border-green-200">
            {activeBusinessUnit.departments?.length || 0} Departments
          </Badge>
        </div>
      )}
      
      {/* Add Department Form */}
      <Card className="border border-gray-200 mb-1">
        <CardHeader className="pb-2 border-b border-gray-200">
          <CardTitle className="text-lg">Add Department</CardTitle>
        </CardHeader>
        <CardContent className="">
          <p className="text-sm text-gray-500 mb-3">
            Create a new department in {activeBusinessUnit?.name || 'the selected business unit'}
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Department Name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                disabled={!activeBusinessUnitId || isLoading}
                className="h-9 border-gray-300"
              />
              {isLoading && (
                <div className="absolute right-3 top-2.5 animate-spin h-4 w-4 border-2 border-gray-300 rounded-full border-t-gray-600" />
              )}
            </div>
            <Button
              onClick={handleAddDepartment}
              disabled={!newDepartmentName.trim() || !activeBusinessUnitId || isLoading}
              className="h-9 bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Department
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeBusinessUnit?.departments && activeBusinessUnit.departments.length > 0 && (
        <div className="flex items-center gap-2 bg-transparent p-2 rounded">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 border-gray-300 bg-white"
            />
          </div>
          <Button
            variant="outline"
            className="h-8 border-gray-300 bg-white"
            onClick={validateDepartment}
            disabled={!selectedDepartmentId}
          >
            <SlidersHorizontal className="mr-1 h-4 w-4" />
            Validate Department
          </Button>
        </div>
      )}

      {validationMessage && (
        <Alert className={`mb-2 ${
          validationMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          validationMessage.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          <AlertDescription>{validationMessage.message}</AlertDescription>
        </Alert>
      )}

      {activeBusinessUnit?.departments && activeBusinessUnit.departments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredDepartments.map(department => (
            <DepartmentItem
              key={department.id}
              department={department}
              isActive={selectedDepartmentId === department.id?.toString()}
              onClick={() => setSelectedDepartmentId(department.id?.toString() || '')}
              onViewHierarchy={() => {
                setSelectedDepartmentId(department.id?.toString() || '');
                setActiveTab('hierarchy');
              }}
              onAddDesignation={() => {
                setSelectedDepartmentId(department.id?.toString() || '');
                setIsAddDesignationDialogOpen(true);
              }}
              departments={activeBusinessUnit?.departments || []}
              setDepartments={(updatedDepartments) => {
                const updatedBusinessUnits = businessUnits.map(bu => {
                  if (bu.id === activeBusinessUnitId) {
                    const newDepartments = Array.isArray(updatedDepartments) 
                      ? updatedDepartments 
                      : updatedDepartments(bu.departments || []);
                    
                    return {
                      ...bu,
                      departments: newDepartments,
                    };
                  }
                  return bu;
                });
                
                setBusinessUnits(updatedBusinessUnits as BusinessUnit[]);
              }}
              businessUnitId={activeBusinessUnitId}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center border border-gray-200 rounded bg-gray-50">
          <FolderOpen className="w-10 h-10 mx-auto text-gray-400" />
          <h3 className="mt-2 text-base font-medium">No departments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "No departments match your search criteria." : "Get started by creating your first department."}
          </p>
          {searchTerm && (
            <Button 
              variant="outline"
              className="mt-3 h-8 border-gray-300"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  );
};