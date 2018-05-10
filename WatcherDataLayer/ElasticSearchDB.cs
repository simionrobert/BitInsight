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

            var torrent = searchResponse.Source;
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

        public long GetTorrentsTotalNumber()
        {
            //TODO: Test 
            var result = _client.Count<Torrent>(c => c
                .Index("torrent")
                .Type("doc")
            );
            return result.Count;
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
                        Field = "Search",
                        Value = value
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
                        Field = "Search",
                        Value = value
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
                Query = new MatchAllQuery()
            };


            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }



        /// <summary>
        /// ///////////////////////////////////////////////////////////////////////////////////////
        /// </summary>
        /// <returns></returns>
        public IEnumerable<SetIPs> GetAllIPs()
        {
            var searchResponse = _client.Search<SetIPs>(s => s
                .Index("ip")
                .Type("doc")
                 .Query(q => q
                     .MatchAll()
                 )
             );

            return Converter.ConvertToIP(searchResponse); ;
        }


        public long GetIPTotalNumber()
        {
            //TODO: Test 
            var result = _client.Count<SetIPs>(c => c
                .Index("ip")
                .Type("doc")
            );
            return result.Count;
        }

        public long GetTorrentsWithIPList()
        {
            //TODO: Test 
            var result = _client.Search<SetIPs>(c => c
                .Index("ip")
                .Type("doc")
                .Source(false)
                .Query(q => q
                    .Exists( d=> d
                        .Name("named_query")
                        .Field(p => p.IPs)
                    )
                 )
            );

            SearchRequest<SetIPs> searchRequest = new SearchRequest<SetIPs>("ip", "doc")
            {

                Source = false,
                Query = new ExistsQuery()
                {
                    Name = "named_query",
                    Field = "IPs"
                }
            };


            var searchResponse = _client.Search<SetIPs>(searchRequest);

            return searchResponse.Total;
        }


        public SetIPs  GetIPsByTorrent(String id)
        {
            var searchResponse = _client.Get<SetIPs>(id, idx => idx.Index("ip").Type("doc"));

            SetIPs ips = new SetIPs()
            {
                IPs = searchResponse.Source.IPs,
                ID = searchResponse.Id,
                Date=searchResponse.Source.Date
            };

            return ips;
        }

        public IEnumerable<Torrent> GetTorrentsByIP(String ip, int startIndex, int size, String sortField, String sortOrder)
        {

            // Get all torrents IDs from IP
            SearchRequest<SetIPs> searchRequestIP = new SearchRequest<SetIPs>("ip", "doc")
            {
                Source = false,
                Query = new TermQuery
                {
                    Field = "IPs",
                    Value = ip
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
                    }
                };
            }

            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }

        public Dictionary<String, long> GetIPTorrentDistribution()
        {
            Dictionary<String, long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("ip", "doc")
            {
                Source = false,
                Sort = new List<ISort>
                {
                    new SortField { Field = "IPs.keyword", Order = SortOrder.Ascending }
                },
                Aggregations = new Dictionary<string, IAggregationContainer>
                {
                    { "my_terms_agg", new AggregationContainer
                        {
                            Terms = new TermsAggregation("state")
                            {
                                Size = 2147483647,
                                Field = "IPs.keyword",
                                Order = new List<TermsOrder>{
                                    TermsOrder.KeyAscending
                                }
                            }
                        }
                    }
                }
            };

            var result = _client.Search<SetIPs>(request);

            var aggs = result.Aggregations.Terms("my_terms_agg");
            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            // Try to limit nr of points
            double avg = categories.Average(r => r.Value);
            IEnumerable<KeyValuePair<String,long>> x = categories.Where(r => r.Value > avg);
            Dictionary<String, long> simplifiedCategory = x.ToDictionary(aa => aa.Key, a => a.Value);

            return simplifiedCategory;
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
    }
}
