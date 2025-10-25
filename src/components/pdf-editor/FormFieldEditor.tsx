import { useState, useEffect } from 'react';
import { FormField } from '@/lib/pdf/formExtractor';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface FormFieldEditorProps {
  fields: FormField[];
  onFieldChange: (fieldName: string, value: string) => void;
  scale?: number;
}

export function FormFieldEditor({ fields, onFieldChange, scale = 1 }: FormFieldEditorProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialValues: Record<string, string> = {};
    fields.forEach(field => {
      initialValues[field.name] = field.value;
    });
    setFieldValues(initialValues);
  }, [fields]);

  const handleChange = (fieldName: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
    onFieldChange(fieldName, value);
  };

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fields.map((field, idx) => (
        <div
          key={idx}
          className="absolute pointer-events-auto"
          style={{
            left: field.x * scale,
            top: field.y * scale,
            width: field.width * scale,
            height: field.height * scale,
          }}
        >
          {field.type === 'text' && (
            <Input
              value={fieldValues[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="h-full w-full bg-blue-50/50 border-blue-300 text-sm"
              placeholder={field.name}
            />
          )}
          {field.type === 'checkbox' && (
            <div className="flex items-center justify-center h-full bg-blue-50/50 border border-blue-300 rounded">
              <Checkbox
                checked={fieldValues[field.name] === 'true'}
                onCheckedChange={(checked) => handleChange(field.name, checked ? 'true' : 'false')}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
