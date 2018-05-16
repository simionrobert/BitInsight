using Nest;
using System;
using System.Collections.Generic;
using System.Text;
using WatcherDataLayer.Models;
using System.Linq;

namespace WatcherDataLayer
{
    public class ElasticSearchDB
    {
        private List<String> list = new List<string>();
        private ElasticClient _client;

        public ElasticSearchDB(String connection)
        {
            ConnectionSettings settings = new ConnectionSettings(new Uri(connection))
                .DefaultIndex("torrent");

            _client = new ElasticClient(settings);
        }

        public IEnumerable<Torrent> GetTorrents(int startIndex, int size, String sortField, String sortOrder)
        {
            sortField = Utils.ParseSortField(sortField);

            if (sortField != null)
                return GetAllTorrents(startIndex, size, sortField, sortOrder);
            else
                return GetAllTorrents(startIndex, size, "Date", "desc"); //default
        }

        public Torrent GetTorrentByID(String id)
        {
            var searchResponse = _client.Get<Torrent>(id, idx => idx.Index("torrent").Type("doc"));

            Torrent torrent = searchResponse.Source;
            torrent.ID = searchResponse.Id;

            return torrent;
        }

        public IEnumerable<Torrent> SearchTorrentsByName(String value, int startIndex, int size, String sortField, String sortOrder)
        {
            return SearchTorrents("Search", value, startIndex, size, sortField, sortOrder);
        }
        public IEnumerable<Torrent> GetTorrentsByCategory(String type, int startIndex, int size, String sortField, String sortOrder)
        {
            return SearchTorrents("Type", type, startIndex, size, sortField, sortOrder);
        }
        public IEnumerable<Torrent> GetTorrentsByTags(String type, int startIndex, int size, String sortField, String sortOrder)
        {
            return SearchTorrents("Categories", type, startIndex, size, sortField, sortOrder);
        }

        private IEnumerable<Torrent> SearchTorrents(String field, String value, int startIndex, int size, String sortField, String sortOrder)
        {
            SearchRequest<Torrent> searchRequest;

            if (sortField != null)
            {
                sortField = Utils.ParseSortField(sortField);

                searchRequest = new SearchRequest<Torrent>("torrent", "doc")
                {

                    From = startIndex,
                    Size = size,
                    Sort = new List<ISort>
                    {
                        new SortField { Field = sortField, Order =  sortOrder.CompareTo("asc") == 0 ? SortOrder.Ascending : SortOrder.Descending }
                    },
                    Query = new TermQuery
                    {
                        Field = field,
                        Value = value
                    } && new ExistsQuery
                    {
                        Field = "Name"
                    }
                };
            }
            else
            {
                searchRequest = new SearchRequest<Torrent>("torrent", "doc")
                {
                    From = startIndex,
                    Size = size,
                    Query = new TermQuery
                    {
                        Field = field,
                        Value = value
                    } && new ExistsQuery
                    {
                        Field = "Name"
                    }
                };
            }

            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }

        private IEnumerable<Torrent> GetAllTorrents(int startIndex, int size, String sortField, String sortOrder)
        {
            SearchRequest<Torrent> searchRequest = new SearchRequest<Torrent>("torrent", "doc")
            {
                From = startIndex,
                Size = size,
                Sort = new List<ISort>
                    {
                        new SortField { Field = sortField, Order =  sortOrder.CompareTo("asc") == 0 ? SortOrder.Ascending : SortOrder.Descending }
                    },
                Query = new MatchAllQuery() && new ExistsQuery
                {
                    Field = "Name"
                }
            };


            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }

        public IPModel GetIP(String ip)
        {
            var searchResponse = _client.Get<IPModel>(ip, idx => idx.Index("ip").Type("doc"));
            IPModel IP = searchResponse.Source;
            return IP;
        }

        public RelationModel GetIPsByTorrent(String id)
        {
            var searchResponse = _client.Get<RelationModel>(id, idx => idx.Index("relation").Type("doc"));
            RelationModel IPs = searchResponse.Source;

            return IPs;
        }

        public IEnumerable<Torrent> GetTorrentsByIP(String ip, int startIndex, int size, String sortField, String sortOrder)
        {
            // Get all torrents IDs from IP
            SearchRequest<RelationModel> searchRequestIP = new SearchRequest<RelationModel>("relation", "doc")
            {
                Source = false,
                Query = new TermQuery
                {
                    Field = "IPs",
                    Value = ip
                }
            };

            var searchResponseIP = _client.Search<RelationModel>(searchRequestIP);
            List<String> listInfohash = new List<string>();
            foreach (var doc in searchResponseIP.Hits)
            {
                listInfohash.Add(doc.Id);
            }


            // Get torrents with these IDs
            SearchRequest<Torrent> searchRequest;

            if (sortField != null)
            {
                sortField = Utils.ParseSortField(sortField);

                searchRequest = new SearchRequest<Torrent>("torrent", "doc")
                {

                    From = startIndex,
                    Size = size,
                    Sort = new List<ISort>
                    {
                        new SortField { Field = sortField, Order =  sortOrder.CompareTo("asc") == 0 ? SortOrder.Ascending : SortOrder.Descending }
                    },
                    Query = new TermsQuery
                    {
                        Field = "_id",
                        Terms = listInfohash.ToArray()
                    } && new ExistsQuery
                    {
                        Field = "Name"
                    }
                };
            }
            else
            {
                searchRequest = new SearchRequest<Torrent>("torrent", "doc")
                {
                    From = startIndex,
                    Size = size,
                    Query = new TermsQuery
                    {
                        Field = "_id",
                        Terms = listInfohash.ToArray()
                    } && new ExistsQuery
                    {
                        Field = "Name"
                    }
                };
            }

            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }


        public long GetTorrentsNumberWithDesc()
        {
            var searchRequest = new CountRequest<Torrent>("torrent", "doc")
            {
                Query = new ExistsQuery
                {
                    Field = "Name"
                }
            };

            var searchResponse = _client.Count<Torrent>(searchRequest);
            return searchResponse.Count;
        }

        public long GetTorrentsTotalNumber()
        {
            var result = _client.Count<Torrent>(c => c
                .Index("torrent")
                .Type("doc")
            );
            return result.Count;
        }

        public long GetTorrentsNumberWithIP()
        {
            var result = _client.Count<RelationModel>(c => c
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

            var result = _client.Search<RelationModel>(request);

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


        public Dictionary<String, long> GetTorrentPeerCountByCategory()
        {
            Dictionary<String, long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("torrent", "doc")
            {
                Source = false,
                Aggregations = new Dictionary<string, IAggregationContainer>
                {
                    { "my_terms_agg", new AggregationContainer
                        {
                            Terms = new TermsAggregation("state")
                            {
                                Field = "Type"
                            },
                            Aggregations = new SumAggregation("commits_sum", "Peers")
                            {
                                Field = "Peers"
                            }
                        }
                    }
                }
            };

            var result = _client.Search<Torrent>(request);

            var aggs = result.Aggregations.Terms("my_terms_agg");
            foreach (var bucket in aggs.Buckets)
            {
                var x = bucket.Sum("commits_sum");
                categories.Add(bucket.Key, (long)x.Value.Value);
            }

            return categories;
        }

        public Dictionary<String, long> GetTorrentCountByCategory()
        {
            Dictionary<String, long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("torrent", "doc")
            {
                Source = false,
                Aggregations = new Dictionary<string, IAggregationContainer>
                {
                    { "my_terms_agg", new AggregationContainer
                        {
                            Terms = new TermsAggregation("state")
                            {
                                Field = "Type"
                            }
                        }
                    }
                }
            };

            var result = _client.Search<Torrent>(request);

            var aggs = result.Aggregations.Terms("my_terms_agg");
            if (aggs == null)
                return null;

            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            return categories;
        }

       
        public Dictionary<String, long> GetTopCountries()
        {
            //TODO: Maybe parse with sth and return String instead of code
            //Do not forget to modify GetTopCities(String country)
            return GetTop("geoip.country_iso_code");
        }

        public Dictionary<String, long> GetTopCities()
        {
            return GetTop("geoip.city_name");
        }
        public Dictionary<String, long> GetTopContinents()
        {
            return GetTop("geoip.continent_name");
        }
        public Dictionary<String, long> GetTopCities(String country)
        {
            SearchRequest<IPModel> searchRequestIP = new SearchRequest<IPModel>("ip", "doc")
            {
                Source = false,
                Size=0,
                Aggregations = new FilterAggregation("tag_names")
                {
                    Filter = new TermQuery
                    {
                        Name="TAG",
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

            var searchResponseIP = _client.Search<IPModel>(searchRequestIP);
            var filterAgg = searchResponseIP.Aggregations.Filter("tag_names");
            var aggregation  = filterAgg.Terms("tag_names");

            Dictionary<String, long> categories = new Dictionary<string, long>();
            foreach (var bucket in aggregation.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            return categories;
        }

        private Dictionary<String, long> GetTop(String type)
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

            var searchResponseIP = _client.Search<IPModel>(searchRequestIP);
            var aggs = searchResponseIP.Aggregations.Terms("tag_names");

            Dictionary<String, long> categories = new Dictionary<string, long>();
            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            return categories;
        }
    }
}
