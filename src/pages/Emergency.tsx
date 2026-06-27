import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';

const Emergency = () => {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <GlobalResourcesMap emergencyMode />
    </div>
  );
};

export default Emergency;
