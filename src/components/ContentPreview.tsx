import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import React from 'react';

interface ContentPreviewProps {
  externalOpen: boolean;
  setExternalOpen: (open: boolean) => void;
  data: string | React.ReactNode;
}

export default function ContentPreview({
                                       externalOpen,
                                       setExternalOpen,
                                       data,
                                     }: ContentPreviewProps) {
  return (
    <Dialog open={externalOpen} onOpenChange={setExternalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>课程详情</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center items-center py-8">
          {data}
        </div>
      </DialogContent>
    </Dialog>
  );
}
