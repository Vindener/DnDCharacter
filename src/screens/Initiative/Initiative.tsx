import React, { useEffect, useMemo, useState } from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppStackParamList } from '@/navigation/AppNavigator';
import type { DMCampaign } from '@/dm/domain/types';
import { subscribeAccessibleCampaigns } from '@/dm/repositories/campaignRepository';
import useDmSettingsStore from '@/context/DmSettings-store';
import { useCampaignOwnership } from '@/dm/hooks/useCampaignOwnership';
import LocalInitiativeBoard from './LocalInitiativeBoard';
import CampaignInitiativeBoard from './CampaignInitiativeBoard';

type Props = BottomTabScreenProps<AppStackParamList, 'Initiative'>;

// Resolves which campaign (if any) this Initiative tab open should be scoped to, then
// renders either the shared live tracker or the fully local ad-hoc board. Priority:
// 1) an explicit campaignId route param (set by DMEncounterPrep's "Start Initiative"),
// 2) the user's "default campaign" Settings preference, if it's still one they have
//    access to, 3) the local, offline, no-login ad-hoc board (unchanged behavior).
const Initiative: React.FC<Props> = ({ route }) => {
  const [campaigns, setCampaigns] = useState<DMCampaign[]>([]);
  const defaultCampaignId = useDmSettingsStore((s) => s.defaultCampaignId);
  const loadDefaultCampaignId = useDmSettingsStore((s) => s.loadDefaultCampaignId);

  useEffect(() => {
    void loadDefaultCampaignId();
  }, [loadDefaultCampaignId]);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;

    const run = async () => {
      unsub = await subscribeAccessibleCampaigns((next) => {
        if (!cancelled) setCampaigns(next);
      });
    };

    void run();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const resolvedCampaignId = useMemo(() => {
    const routeCampaignId = route.params?.campaignId;
    if (routeCampaignId) return routeCampaignId;
    if (defaultCampaignId && campaigns.some((campaign) => campaign.id === defaultCampaignId)) return defaultCampaignId;
    return null;
  }, [campaigns, defaultCampaignId, route.params?.campaignId]);

  const campaign = useMemo(() => campaigns.find((item) => item.id === resolvedCampaignId) || null, [campaigns, resolvedCampaignId]);
  const { isOwner } = useCampaignOwnership(campaign);

  if (resolvedCampaignId) {
    return <CampaignInitiativeBoard campaignId={resolvedCampaignId} campaign={campaign} isOwner={isOwner} />;
  }

  return <LocalInitiativeBoard />;
};

export default Initiative;
