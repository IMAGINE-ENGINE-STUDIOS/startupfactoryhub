import { GlobalResourcesMap } from '@/components/GlobalResourcesMap';

const ResourcesPage = () => {
  return (
    <div className="relative overflow-hidden" style={{
      height: 'calc(100vh - 12rem)',
      minHeight: '500px'
    }}>
      <div className="absolute inset-0">
        <GlobalResourcesMap />
      </div>
    </div>
  );
};

export default ResourcesPage;
