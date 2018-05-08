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

        public IEnumerable<Torrent> SearchTorrentsByName(String name, int startIndex, int size, String sortField, String sortOrder)
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
                        Value = name
                    }
                };
            } else
            {
                searchRequest = new SearchRequest<Torrent>("torrent", "doc")
                {
                    From = startIndex,
                    Size = size,
                    Query = new TermQuery
                    {
                        Field = "Search",
                        Value = name
                    }
                };
            }

            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }

        public Torrent GetTorrentByID(String id)
        {
            var searchResponse = _client.Get<Torrent>(id, idx => idx.Index("torrent").Type("doc"));

            var torrent = searchResponse.Source;
            torrent.ID = searchResponse.Id;

            return torrent;
        }

        public IEnumerable<Torrent> GetTorrentsByCategory(String type, int startIndex, int size, String sortField, String sortOrder)
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
                        Field = "Type.keyword",
                        Value = type
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
                        Field = "Type.keyword",
                        Value = type
                    }
                };
            }

            var searchResponse = _client.Search<Torrent>(searchRequest);

            return Converter.ConvertToTorrent(searchResponse);
        }

        public IEnumerable<Torrent> GetTorrentsByTags(String type, int startIndex, int size, String sortField, String sortOrder)
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
                        Field = "Categories.keyword",
                        Value = type
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
                        Field = "Categories.keyword",
                        Value = type
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

        public Dictionary<String, long> GetTorrentPeerCountByCategory()
        {
            Dictionary<String, long> categories = new Dictionary<string, long>();

            var request = new SearchRequest("torrent", "doc")
            {
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
            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key,bucket.DocCount.Value);
            }

            return categories;
        }
    }
}
