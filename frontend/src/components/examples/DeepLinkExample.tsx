import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeadsDeepLink } from '@/hooks/useDeepLink';
import { useLeadsUrlState } from '@/hooks/useLeadsUrlState';
import { Copy, Share2, Link, ExternalLink } from 'lucide-react';

/**
 * Example component demonstrating the deep linking system.
 *
 * This component shows how to:
 * 1. Use URL state management
 * 2. Generate deep-linkable URLs
 * 3. Share URLs with current state
 * 4. Create programmatic navigation links
 */
export const DeepLinkExample: React.FC = () => {
  const leadsUrlState = useLeadsUrlState();
  const { generateUrl, generateShareableUrl, copyCurrentUrl, getCurrentUrl } =
    useLeadsDeepLink();

  const handleCopyUrl = async () => {
    await copyCurrentUrl();
    // You could show a toast notification here
    console.log('URL copied to clipboard!');
  };

  const handleShareUrl = async () => {
    const url = getCurrentUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Leads Dashboard',
          text: 'Check out these leads with current filters applied',
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy
      await copyCurrentUrl();
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Link className='h-5 w-5' />
            Deep Linking System Example
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Current State Display */}
          <div>
            <h3 className='font-semibold mb-2'>Current URL State:</h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
              <Badge variant='outline'>Page: {leadsUrlState.page}</Badge>
              <Badge variant='outline'>Limit: {leadsUrlState.limit}</Badge>
              <Badge variant='outline'>Status: {leadsUrlState.status}</Badge>
              <Badge variant='outline'>View: {leadsUrlState.viewMode}</Badge>
              {leadsUrlState.search && (
                <Badge variant='outline'>Search: {leadsUrlState.search}</Badge>
              )}
              <Badge variant='outline'>Sort: {leadsUrlState.sortBy}</Badge>
            </div>
          </div>

          {/* URL Actions */}
          <div className='flex flex-wrap gap-2'>
            <Button onClick={handleCopyUrl} variant='outline' size='sm'>
              <Copy className='h-4 w-4 mr-2' />
              Copy URL
            </Button>
            <Button onClick={handleShareUrl} variant='outline' size='sm'>
              <Share2 className='h-4 w-4 mr-2' />
              Share URL
            </Button>
          </div>

          {/* Generated URLs */}
          <div className='space-y-2'>
            <h3 className='font-semibold'>Generated URLs:</h3>
            <div className='space-y-2 text-sm'>
              <div>
                <strong>Current URL:</strong>
                <div className='bg-muted p-2 rounded text-xs break-all'>
                  {getCurrentUrl()}
                </div>
              </div>
              <div>
                <strong>New Leads Only:</strong>
                <div className='bg-muted p-2 rounded text-xs break-all'>
                  {generateUrl({ status: 'new', page: 1 })}
                </div>
              </div>
              <div>
                <strong>Search Results:</strong>
                <div className='bg-muted p-2 rounded text-xs break-all'>
                  {generateUrl({ search: 'john', page: 1 })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Navigation Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => leadsUrlState.setStatus('new')}
            >
              New Leads
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => leadsUrlState.setStatus('qualified')}
            >
              Qualified
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => leadsUrlState.setViewMode('kanban')}
            >
              Kanban View
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => leadsUrlState.setPage(1)}
            >
              First Page
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deep Link Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Deep Link Buttons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Button
              variant='outline'
              onClick={() => {
                const url = generateUrl({ status: 'new', page: 1, limit: 20 });
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className='h-4 w-4 mr-2' />
              Open New Leads (20 per page)
            </Button>
            <Button
              variant='outline'
              onClick={() => {
                const url = generateUrl({
                  status: 'qualified',
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                });
                window.open(url, '_blank');
              }}
            >
              <ExternalLink className='h-4 w-4 mr-2' />
              Open Qualified (Latest First)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeepLinkExample;
