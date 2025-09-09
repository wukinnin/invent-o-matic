import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader } from 'lucide-react';

const LoadingOverlay = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <Loader className="h-12 w-12 animate-spin text-white" />
        <p className="text-lg font-semibold text-white">Processing...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;