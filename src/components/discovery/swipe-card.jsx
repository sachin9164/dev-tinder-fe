import { useEffect, useRef, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const SWIPE_THRESHOLD = 110;
const SWIPE_OUT_DISTANCE = 680;

function safeName(user) {
  return `${user?.firstName || user?.firstname || ''} ${user?.lastName || user?.lastname || ''}`.trim();
}

export function SwipeCard({ user, onIgnore, onInterested, busy }) {
  const skills = Array.isArray(user?.skills) ? user.skills : [];
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const pointerIdRef = useRef(null);
  const swipeActionPendingRef = useRef(false);

  useEffect(() => {
    setDragX(0);
    setIsDragging(false);
    pointerIdRef.current = null;
    swipeActionPendingRef.current = false;
  }, [user?._id]);

  useEffect(() => {
    if (!busy) {
      swipeActionPendingRef.current = false;
    }
  }, [busy]);

  const handlePointerDown = (event) => {
    if (busy || swipeActionPendingRef.current) {
      return;
    }

    if (event.target.closest('button')) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (
      !isDragging ||
      pointerIdRef.current === null ||
      pointerIdRef.current !== event.pointerId
    ) {
      return;
    }

    setDragX(event.clientX - startXRef.current);
  };

  const finishGesture = async (deltaX) => {
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      setDragX(0);
      return;
    }

    swipeActionPendingRef.current = true;
    const swipedRight = deltaX > 0;
    setDragX(swipedRight ? SWIPE_OUT_DISTANCE : -SWIPE_OUT_DISTANCE);

    // Let the user see the swipe-out animation before moving to next profile.
    await new Promise((resolve) => {
      window.setTimeout(resolve, 140);
    });

    if (swipedRight) {
      onInterested();
      return;
    }

    onIgnore();
  };

  const handlePointerUp = (event) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pointerIdRef.current = null;
    setIsDragging(false);
    finishGesture(dragX);
  };

  const handlePointerCancel = (event) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    setIsDragging(false);
    setDragX(0);
  };

  const cardOpacity = Math.max(0.72, 1 - Math.abs(dragX) / 380);
  const rightHintOpacity = Math.max(0, Math.min(1, dragX / SWIPE_THRESHOLD));
  const leftHintOpacity = Math.max(0, Math.min(1, -dragX / SWIPE_THRESHOLD));

  return (
    <Card
      className="mx-auto w-full max-w-md overflow-hidden"
      style={{
        transform: `translateX(${dragX}px) rotate(${dragX / 18}deg)`,
        opacity: cardOpacity,
        transition: isDragging ? 'none' : 'transform 180ms ease, opacity 180ms ease',
        touchAction: 'pan-y',
        cursor: busy ? 'default' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="relative h-80 w-full overflow-hidden">
        <img
          src={user?.photoUrl}
          alt={safeName(user)}
          className="h-full w-full object-cover"
         
        />
        <div className="pointer-events-none absolute left-3 top-3">
          <Badge
            variant="outline"
            className="border-red-500 bg-white/90 text-red-600"
            style={{ opacity: leftHintOpacity }}
          >
            IGNORE
          </Badge>
        </div>
        <div className="pointer-events-none absolute right-3 top-3">
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700"
            style={{ opacity: rightHintOpacity }}
          >
            INTERESTED
          </Badge>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4">
          <h2 className="text-2xl font-bold text-white">
            {safeName(user) || 'Developer'}
          </h2>
          <p className="text-sm text-white/90">{user?.email}</p>
        </div>
      </div>

      <CardContent className="space-y-4 pt-4">
        <p className="line-clamp-3 text-sm text-slate-600">
          {user?.about || 'No bio yet. Swipe right to connect.'}
        </p>

        <div className="flex flex-wrap gap-2">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))
          ) : (
            <Badge variant="outline">No skills listed</Badge>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={onIgnore}
          >
            <X className="h-4 w-4" />
            Ignore
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={busy}
            onClick={onInterested}
          >
            <Heart className="h-4 w-4" />
            Interested
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
