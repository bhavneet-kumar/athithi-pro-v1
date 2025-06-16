import {
  FileUp,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import * as Papa from 'papaparse';
import type { ChangeEvent } from 'react';
import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useCrmStore } from '@/lib/store';
import { LeadStatus, LeadSource } from '@/types/crm';

// Schema for validating CSV rows
const csvRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  source: z.nativeEnum(LeadSource).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  tags: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  budget: z
    .string()
    .optional()
    .transform(val => {
      if (!val) {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
  travelStartDate: z.string().optional().or(z.literal('')),
  travelEndDate: z.string().optional().or(z.literal('')),
  destination: z.string().optional().or(z.literal('')),
  accommodation: z.string().optional().or(z.literal('')),
  activities: z.string().optional().or(z.literal('')),
});

type CSVRow = z.infer<typeof csvRowSchema>;

interface ValidationResult {
  valid: CSVRow[];
  errors: { row: number; errors: Record<string, string> }[];
}

// Generate a sample CSV for download
const generateSampleCSV = () => {
  const headers = [
    'name',
    'email',
    'phone',
    'source',
    'status',
    'tags',
    'notes',
    'budget',
    'travelStartDate',
    'travelEndDate',
    'destination',
    'accommodation',
    'activities',
  ];

  const rows = [
    [
      'John Smith',
      'john@example.com',
      '+1234567890',
      'website',
      'new',
      'family,summer',
      'Looking for family vacation',
      '5000',
      '2023-07-15',
      '2023-07-25',
      'Hawaii',
      'Resort',
      'Beach,Hiking,Snorkeling',
    ],
    [
      'Emma Johnson',
      'emma@example.com',
      '+1987654321',
      'referral',
      'contacted',
      'honeymoon',
      'Planning a honeymoon trip',
      '8000',
      '2023-10-05',
      '2023-10-15',
      'Maldives',
      'Overwater bungalow',
      'Snorkeling,Spa',
    ],
  ];

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  return csvContent;
};

// Download the sample CSV
const downloadSampleCSV = () => {
  const csvContent = generateSampleCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample_leads.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const BulkUploadModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addLead, isOffline } = useCrmStore();

  const resetState = () => {
    setFile(null);
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setValidationResult(null);
    }
  };

  const validateAndParseCSV = () => {
    if (!file) {
      return;
    }

    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        const valid: CSVRow[] = [];
        const errors: { row: number; errors: Record<string, string> }[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Validate the row data against our schema
            const parsedRow = csvRowSchema.parse(row);
            valid.push(parsedRow);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const fieldErrors: Record<string, string> = {};
              error.errors.forEach(err => {
                const field = err.path[0].toString();
                fieldErrors[field] = err.message;
              });
              errors.push({ row: index + 2, errors: fieldErrors }); // +2 for 1-indexed and header
            }
          }
        });

        setValidationResult({ valid, errors });
        setIsProcessing(false);
      },
      error: error => {
        console.error('Error parsing CSV:', error);
        toast({
          title: 'Error Parsing CSV',
          description:
            'Failed to parse the CSV file. Please check the file format.',
          variant: 'destructive',
        });
        setIsProcessing(false);
      },
    });
  };

  const handleImport = () => {
    if (!validationResult?.valid.length) {
      return;
    }

    // Import valid rows into the system
    validationResult.valid.forEach(row => {
      const now = new Date();

      // Process travel dates if provided
      const travelDates = row.travelStartDate
        ? {
            start: new Date(row.travelStartDate),
            end: row.travelEndDate ? new Date(row.travelEndDate) : undefined,
          }
        : undefined;

      // Process preferences if provided
      const preferences: Record<string, string> = {};
      if (row.destination) {
        preferences.destination = row.destination;
      }
      if (row.accommodation) {
        preferences.accommodation = row.accommodation;
      }
      if (row.activities) {
        preferences.activities = row.activities;
      }

      addLead({
        id: `lead-${uuidv4()}`,
        name: row.name,
        email: row.email || undefined,
        phone: row.phone || undefined,
        status: row.status || LeadStatus.NEW,
        source: row.source || LeadSource.OTHER,
        tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : [],
        notes: row.notes || undefined,
        budget: row.budget,
        travelDates: travelDates,
        createdAt: now,
        updatedAt: now,
        assignedTo: undefined,
        collaborators: [],
        aiPriorityScore: 0.5,
        preferences:
          Object.keys(preferences).length > 0 ? preferences : undefined,
        isReturnCustomer: false,
      });
    });

    toast({
      title: 'Import Successful',
      description: `${validationResult.valid.length} leads have been imported successfully.`,
    });

    setIsOpen(false);
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='gap-2'
          disabled={isOffline}
          onClick={() => setIsOpen(true)}
        >
          <FileUp className='h-4 w-4' />
          Import Leads
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Import Leads via CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with lead information. Download the sample
            template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <Button
            variant='outline'
            onClick={downloadSampleCSV}
            className='w-full gap-2'
          >
            <Download className='h-4 w-4' />
            Download Sample CSV
          </Button>

          <div className='grid w-full items-center gap-1.5'>
            <label htmlFor='csv-file' className='text-sm font-medium'>
              Choose CSV File
            </label>
            <input
              id='csv-file'
              type='file'
              accept='.csv'
              className='file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 text-sm'
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={isProcessing}
            />
          </div>

          {file && !validationResult && (
            <Button
              onClick={validateAndParseCSV}
              disabled={isProcessing}
              className='w-full'
            >
              {isProcessing ? 'Validating...' : 'Validate CSV'}
            </Button>
          )}

          {validationResult && (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <div className='flex-1'>
                  <div className='text-sm font-medium'>Valid Records</div>
                  <div className='flex items-center gap-1 text-sm'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    {validationResult.valid.length} records
                  </div>
                </div>

                <div className='flex-1'>
                  <div className='text-sm font-medium'>Error Records</div>
                  <div className='flex items-center gap-1 text-sm'>
                    <XCircle className='h-4 w-4 text-red-500' />
                    {validationResult.errors.length} records
                  </div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Invalid CSV Rows</AlertTitle>
                  <AlertDescription>
                    {validationResult.errors.length === 1 ? (
                      <p>
                        Row {validationResult.errors[0].row} has errors:{' '}
                        {Object.values(validationResult.errors[0].errors).join(
                          ', '
                        )}
                      </p>
                    ) : (
                      <p>
                        {validationResult.errors.length} rows have validation
                        errors. Please fix and try again.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter className='sm:justify-between'>
          <Button
            variant='secondary'
            onClick={() => {
              resetState();
              setIsOpen(false);
            }}
          >
            Cancel
          </Button>

          <Button
            type='submit'
            onClick={handleImport}
            disabled={!validationResult || validationResult.valid.length === 0}
          >
            {validationResult?.valid.length
              ? `Import ${validationResult.valid.length} Lead${validationResult.valid.length !== 1 ? 's' : ''}`
              : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;
