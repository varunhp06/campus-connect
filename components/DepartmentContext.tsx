import React, { createContext, useContext, useState } from 'react';
import { AdministrationMember } from '@/components/data/administration';

interface DepartmentContextType {
  departmentsWithMembers: {[key: string]: AdministrationMember[]};
  setDepartmentsWithMembers: (data: {[key: string]: AdministrationMember[]}) => void;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [departmentsWithMembers, setDepartmentsWithMembers] = useState<{[key: string]: AdministrationMember[]}>({});

  return (
    <DepartmentContext.Provider value={{ departmentsWithMembers, setDepartmentsWithMembers }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartments() {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartments must be used within DepartmentProvider');
  }
  return context;
}