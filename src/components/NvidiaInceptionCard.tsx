import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rocket, ExternalLink } from 'lucide-react';
import nvidiaLogo from '@/assets/NVIDIA.jpeg';

const NVIDIA_URL = 'https://www.nvidia.com/en-us/startups/?ncid=em-even-511353-vt53&nvweb_e=&mkt_tok=MTU2LU9GTi03NDIAAAGgyaJn1WUfrxhH43ovtwTdC_rG321mnwq0cbQ9CEJ2XbvZXRLL7KusQ_vPt6DC3_BRV-qBgU024vMbOIIYOEpDJ8jUnKLz4Kt-8IQbcR38AGjpuP-ZCGHosA';

export default function NvidiaInceptionCard() {
  return (
    <div className="flex-shrink-0 w-[320px] sm:w-[380px]">
      <div className="rounded-lg border hover:border-emerald-500/50 transition-all p-4 space-y-3 h-full flex flex-col">
        <div className="flex items-start gap-3">
          <img src={nvidiaLogo} alt="NVIDIA Inception" className="h-10 w-10 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-1">NVIDIA Inception Program</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">NVIDIA</p>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
            Always Open
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          Free program for AI, data science & HPC startups. Access GPU credits, technical support, investor connections & NVIDIA expertise.
        </p>

        <div className="flex flex-wrap gap-1">
          {['AI / ML', 'Data Science', 'HPC'].map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <Button
            size="sm"
            className="flex-1 gap-1"
            onClick={() => window.open(NVIDIA_URL, '_blank')}
          >
            <Rocket className="h-3 w-3" />
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(NVIDIA_URL, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
