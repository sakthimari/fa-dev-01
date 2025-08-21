import React, { useEffect, useState } from 'react';
import { getConnections } from '../services/ConnectionService';
import { ProfileService } from '../services/ProfileService';

interface Connection {
  id: string;
  friendId: string;
  inviterId: string;
  createdAt: string | null;
}

interface Profile {
  id: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  profilePhotoUrl?: string;
}

const ConnectionsList = ({ userId }: { userId: string }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const conns: Connection[] = await getConnections(userId);
      setConnections(conns);
      // Fetch profiles for all friends
      // Fetch profile for each friendId and map to expected structure
      const profilePromises = conns.map(conn => ProfileService.getProfile(conn.friendId));
      const profileResults = await Promise.all(profilePromises);
      const profileMap: Record<string, Profile> = {};
      profileResults.forEach((profile: any) => {
        if (profile && profile.id) {
          profileMap[profile.id] = {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.profession || profile.role,
            profilePhotoUrl: profile.profilePhotoUrl,
          };
        }
      });
      setProfiles(profileMap);
      setLoading(false);
    }
    fetchData();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!connections.length) return <div>No connections yet.</div>;

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title">Connections</h5>
          <button className="btn btn-primary btn-sm">Invite Friends</button>
        </div>
        <ul className="list-unstyled">
          {/* Render only connections fetched from backend, no hardcoded data */}
          {connections.map((conn) => {
            const profile = profiles[conn.friendId];
            if (!profile) return null;
            const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
            return (
              <li key={conn.id} className="d-flex align-items-center mb-3">
                <img
                  src={profile.profilePhotoUrl || '/default-avatar.png'}
                  alt={fullName}
                  className="avatar avatar-md rounded-circle me-3"
                />
                <div className="flex-grow-1">
                  <div className="fw-bold">{fullName}</div>
                  <div className="text-muted small">{profile.role}</div>
                </div>
                <button className="btn btn-danger btn-sm me-2">Remove</button>
                <button className="btn btn-primary btn-sm">Message</button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default ConnectionsList;
