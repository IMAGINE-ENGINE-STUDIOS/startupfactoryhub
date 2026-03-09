import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';

const ResourcesPage = () => {
  return (
    <div className="relative overflow-hidden w-full" style={{
      height: '100vh',
    }}>
      <div className="absolute inset-0">
        <GlobalResourcesMap />
      </div>
    </div>
  );
};

export default ResourcesPage;
