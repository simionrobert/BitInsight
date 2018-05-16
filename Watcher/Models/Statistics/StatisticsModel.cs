using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Watcher.Models.Statistics
{
    public class StatisticsModel
    {
        public long torrentNrWithDesc;
        public long torrentNrTotal;
        public long torrentNrWithPeerListOnly;
        public Dictionary<String, long> rankCities;
        public Dictionary<String, long> rankCountries;
        public Dictionary<String, long> rankContinents;


        private  Dictionary<String, String> IPTorrentDistribution;
        private Dictionary<String, long> categories;

        public StatisticsModel(
                     Dictionary<string, long> categories,
                     long torrentNrWithDesc,
                     long torrentNrTotal,
                     long torrentNrWithPeerListOnly,
                     Dictionary<String, long> rankCities,
                     Dictionary<String, long> rankCountries,
                     Dictionary<String, long> rankContinents)
        {
            this.categories = categories;
            this.torrentNrWithDesc = torrentNrWithDesc;
            this.torrentNrTotal = torrentNrTotal;
            this.torrentNrWithPeerListOnly = torrentNrWithPeerListOnly;
            this.rankCities = rankCities;
            this.rankCountries = rankCountries;
            this.rankContinents = rankContinents;

            IPTorrentDistribution = new Dictionary<string, string>();
        }

        public Dictionary<String, String> GetCategoryIPDistribution()
        {
            double sum = categories.Sum(r => r.Value);
            IEnumerable<String> p = categories.Select(hit =>
            {
                return (hit.Value / sum).ToString("0.##%");
            });
            List<String> percents = p.ToList();

            int i = 0;
            foreach(KeyValuePair<String,long> kvp in categories)
            {
                IPTorrentDistribution.Add(kvp.Key, kvp.Value + " (" + percents[i] + ")");
                i++;
            }

            return IPTorrentDistribution;
        }


    }
}
