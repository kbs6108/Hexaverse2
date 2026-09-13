import { Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { MapPinOff } from 'lucide-react';

export function NotFound() {
  return (
    <div className="mx-auto max-w-md p-10">
      <EmptyState
        icon={<MapPinOff />}
        title="Off the map"
        body="That page does not exist."
        action={
          <Link to="/map">
            <Button variant="primary">Back to Map Explorer</Button>
          </Link>
        }
      />
    </div>
  );
}
