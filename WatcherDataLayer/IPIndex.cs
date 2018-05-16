using Nest;
using System;
using System.Collections.Generic;
using System.Text;
using WatcherDataLayer.Models;

namespace WatcherDataLayer
{
    public class IPIndex
    {
        private ElasticClient client;

        public IPIndex(ElasticClient client)
        {
            this.client = client;
        }

        public IPModel GetIP(String ip)
        {
            var searchResponse = client.Get<IPModel>(ip, idx => idx.Index("ip").Type("doc"));
            return searchResponse.Source;
        }

        public Dictionary<String, long> GetTop(String type)
        {
            SearchRequest<IPModel> searchRequestIP = new SearchRequest<IPModel>("ip", "doc")
            {
                Source = false,
                Aggregations = new TermsAggregation("tag_names")
                {
                    Size = 20,
                    Field = type
                }
            };

            var searchResponseIP = client.Search<IPModel>(searchRequestIP);
            var aggs = searchResponseIP.Aggregations.Terms("tag_names");

            Dictionary<String, long> categories = new Dictionary<string, long>();
            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            return categories;
        }

        public Dictionary<String, long> GetTopCities(String country)
        {
            SearchRequest<IPModel> searchRequestIP = new SearchRequest<IPModel>("ip", "doc")
            {
                Source = false,
                Size = 0,
                Aggregations = new FilterAggregation("tag_names")
                {
                    Filter = new TermQuery
                    {
                        Name = "TAG",
                        Field = "geoip.country_iso_code",
                        Value = country
                    },
                    Aggregations = new TermsAggregation("tag_names")
                    {
                        Size = 20,
                        Field = "geoip.city_name"
                    }
                }
            };

            var searchResponseIP = client.Search<IPModel>(searchRequestIP);
            var filterAgg = searchResponseIP.Aggregations.Filter("tag_names");
            var aggregation = filterAgg.Terms("tag_names");

            Dictionary<String, long> categories = new Dictionary<string, long>();
            foreach (var bucket in aggregation.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            return categories;
        }
    }
}
