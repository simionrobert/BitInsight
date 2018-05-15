using Nest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using WatcherDataLayer.Models;

namespace WatcherDataLayer
{
    public static class Converter
    {
        public static IEnumerable<Torrent> ConvertToTorrent(ISearchResponse<Torrent> response)
        {
            var torrents = response.Hits.Select(hit =>
            {
                var result = hit.Source;
                result.ID = hit.Id;
                return result;
            });

            return torrents;
        }

        public static IEnumerable<SetIPs> ConvertToIP(ISearchResponse<SetIPs> response)
        {
            IEnumerable<SetIPs> ips = response.Hits.Select(hit =>
            {
                var result = hit.Source;
                return result;
            });

            return ips;
        }

        public static SetIPs ConvertToIP(IGetResponse<SetIPs> response)
        {
            SetIPs ips = response.Source;

            return ips;
        }
    }
}
