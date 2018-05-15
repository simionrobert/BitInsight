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
            return SearchTorrents("Type.keyword", type, startIndex, size, sortField, sortOrder);
        }
        public IEnumerable<Torrent> GetTorrentsByTags(String type, int startIndex, int size, String sortField, String sortOrder)
        {
            return SearchTorrents("Categories.keyword", type, startIndex, size, sortField, sortOrder);
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

        public SetIPs.IPModel GetIP(String ip)
        {
            SearchRequest<SetIPs> searchRequestIP = new SearchRequest<SetIPs>("ip", "doc")
            {
                Source = false,
                Query = new NestedQuery
                {
                    Name = "named_query",
                    Path = "IPs",
                    Query = new TermQuery
                    {
                        Field = "IPs.IP",
                        Value = ip
                    },
                    InnerHits = new InnerHits()
                    {
                        Name="InnerHit"
                    }
                }
            };

            var searchResponseIP = _client.Search<SetIPs>(searchRequestIP);


            foreach (var hit in searchResponseIP.Hits)
            {
                var earlHits = hit.InnerHits["InnerHit"].Hits;
                foreach (var earlHit in earlHits.Hits)
                {
                    SetIPs.IPModel earl = earlHit.Source.As<SetIPs.IPModel>();
                    return earl;
                }
            }
            return null;
        }

        public SetIPs GetIPsByTorrent(String id)
        {
            var searchResponse = _client.Get<SetIPs>(id, idx => idx.Index("ip").Type("doc"));

            return Converter.ConvertToIP(searchResponse);
        }

        public IEnumerable<Torrent> GetTorrentsByIP(String ip, int startIndex, int size, String sortField, String sortOrder)
        {

            // Get all torrents IDs from IP
            SearchRequest<SetIPs> searchRequestIP = new SearchRequest<SetIPs>("ip", "doc")
            {
                Source = false,
                Query = new NestedQuery
                {
                    Name = "named_query",
                    Path = "IPs",
                    Query = new TermQuery
                    {
                        Field = "IPs.IP",
                        Value = ip
                    }
                }
            };

            List<String> listID = new List<string>();
            var searchResponseIP = _client.Search<SetIPs>(searchRequestIP);
            foreach(var d in searchResponseIP.Hits)
            {
                listID.Add(d.Id);
            }
            String[] stringsID = listID.ToArray();



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
                        Terms = stringsID
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
                        Terms = stringsID
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
            var result = _client.Count<SetIPs>(c => c
                .Index("ip")
                .Type("doc")
            );
            return result.Count;
        }

        public Dictionary<String, long> GetIPTorrentDistribution()
        {
            Dictionary<String, long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("ip", "doc")
            {
                Source = false,

                Aggregations= new NestedAggregation("my_terms_agg")
                {
                    Path = "IPs",
                    Aggregations = new TermsAggregation("state")
                    {
                        Size = 2147483647,
                        Field = "IPs.IP",
                        Order = new List<TermsOrder>{
                            TermsOrder.KeyAscending
                        }
                    }
                }
            };

            var result = _client.Search<SetIPs>(request);

            var aggs = result.Aggregations.Nested("my_terms_agg").Terms("state");
            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            // Try to limit nr of points
            double avg = categories.Average(r => r.Value);
            IEnumerable<KeyValuePair<String,long>> x = categories.Where(r => r.Value > avg);
            Dictionary<String, long> simplifiedCategory = x.ToDictionary(aa => aa.Key, a => a.Value);

            return categories;
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
                                Field = "Type.keyword"
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
            Dictionary<String,long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("torrent", "doc")
            {
                Source = false,
                Aggregations = new Dictionary<string, IAggregationContainer>
                {
                    { "my_terms_agg", new AggregationContainer
                        {
                            Terms = new TermsAggregation("state")
                            {
                                Field = "Type.keyword"
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
                categories.Add(bucket.Key,bucket.DocCount.Value);
            }

            return categories;
        }

        //TODO:  Here
        public SetIPs.IPModel GetTopCities()
        {
            SearchRequest<SetIPs> searchRequestIP = new SearchRequest<SetIPs>("ip", "doc")
            {
                Source = false,
                Aggregations = new NestedAggregation("agg")
                {
                    Path = "IPs",
                    Aggregations = new NestedAggregation("tags")
                    {
                        Path = "IPs.geoip",
                        Aggregations = new TermsAggregation("tag_names")
                        {
                            Field = "IPs.geoip.continent_name.keyword"
                        }
                    }
                }
            };

            
                SearchRequest<SetIPs> searchRequestIs = new SearchRequest<SetIPs>("ip", "doc")
                {
                    Source = false,
                    Aggregations = new NestedAggregation("agg")
                    {
                        Path = "IPs",
                        Aggregations = new NestedAggregation("tags")
                        {
                            Path = "geoip",
                            Aggregations = new TermsAggregation("tag_names")
                            {
                                Field = "city_name.keyword"
                            }
                        }
                    }
                };

                var searchResponseIP = _client.Search<SetIPs>(searchRequestIP);


            foreach (var hit in searchResponseIP.Hits)
            {
                var earlHits = hit.InnerHits["InnerHit"].Hits;
                foreach (var earlHit in earlHits.Hits)
                {
                    SetIPs.IPModel earl = earlHit.Source.As<SetIPs.IPModel>();
                    return earl;
                }
            }
            return null;
        }
        public void GetTopCountries()
        {

        }
        public void GetTopContinents()
        {

        }
        public void GetTopCities(String country)
        {

        }
    }
}
