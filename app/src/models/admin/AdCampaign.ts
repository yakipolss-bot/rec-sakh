import { AdPlacement } from './AdPlacement';

export interface AdCampaign {
  id: string;
  name: string;
  placementId: string;
  advertiserName: string;
  advertiserContact: string;
  imageUrl: string;
  targetUrl: string;
  startsAt: string;
  endsAt: string;
  budget: number;
  spent: number;
  impressionsTarget: number | null;
  clicksTarget: number | null;
  isActive: boolean;
  placement?: AdPlacement;
}
