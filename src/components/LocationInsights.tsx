import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const LocationInsights = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start gap-2 mt-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-white">Location Insights</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            GPS Enabled
          </Badge>
        </div>
        <p className="text-gray-500">Location Insights will be available soon...</p>
      </div>
      <div className="mt-8">
        <img
          src="/location.png"
          alt="Location Insights Screenshot"
          className="rounded-2xl shadow-lg max-w-full h-auto"
        />
      </div>
    </div>
  );
};

export default LocationInsights;
