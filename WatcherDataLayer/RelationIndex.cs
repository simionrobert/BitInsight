using Nest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using WatcherDataLayer.Models;

namespace WatcherDataLayer
{
    public class RelationIndex
    {
        private ElasticClient client;

        public RelationIndex(ElasticClient client)
        {
            this.client = client;
        }

        public RelationModel GetIPsByTorrent(String id)
        {
            var searchResponse = client.Get<RelationModel>(id, idx => idx.Index("relation").Type("doc"));
            RelationModel IPs = searchResponse.Source;

            return IPs;
        }

        public List<String> GetTorrentsByIP(String ip)
        {
            SearchRequest<RelationModel> searchRequestIP = new SearchRequest<RelationModel>("relation", "doc")
            {
                Source = false,
                Query = new TermQuery
                {
                    Field = "IPs",
                    Value = ip
                }
            };

            var searchResponseIP = client.Search<RelationModel>(searchRequestIP);
            List<String> listInfohash = new List<string>();
            foreach (var doc in searchResponseIP.Hits)
            {
                listInfohash.Add(doc.Id);
            }

            return listInfohash;
        }

        public long GetTorrentsNumberWithIP()
        {
            var result = client.Count<RelationModel>(c => c
                .Index("relation")
                .Type("doc")
            );
            return result.Count;
        }

        public Dictionary<String, long> GetIPTorrentDistribution()
        {
            Dictionary<String, long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("relation", "doc")
            {
                Source = false,
                Aggregations = new TermsAggregation("state")
                {
                    Size = 2147483647,
                    Field = "IPs",
                    Order = new List<TermsOrder>{
                          TermsOrder.KeyAscending
                    }
                }
            };

            var result = client.Search<RelationModel>(request);

            var aggs = result.Aggregations.Terms("state");
            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            // Try to limit nr of points
            double avg = categories.Average(r => r.Value);
            IEnumerable<KeyValuePair<String, long>> x = categories.Where(r => r.Value > avg);
            Dictionary<String, long> simplifiedCategory = x.ToDictionary(aa => aa.Key, a => a.Value);

            return categories; //or simplifiedCategory TODO: Decide here
        }

        
    }
}
