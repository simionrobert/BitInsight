using Nest;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using WatcherDataLayer.Models;

namespace WatcherDataLayer
{
    public class MetadataIndex
    {
        private ElasticClient client;

        public MetadataIndex(ElasticClient client)
        {
            this.client = client;
        }

        public IEnumerable<Torrent> GetAllTorrents(int startIndex, int size, String sortField, String sortOrder)
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

            var searchResponse = client.Search<Torrent>(searchRequest);
            return ConvertToTorrent(searchResponse);
        }

        public Torrent GetTorrentByID(String id)
        {
            var searchResponse = client.Get<Torrent>(id, idx => idx.Index("torrent").Type("doc"));

            Torrent torrent = searchResponse.Source;
            torrent.ID = searchResponse.Id;

            return torrent;
        }

        public IEnumerable<Torrent> GetTorrentsByListIDs(List<String> listInfohash, int startIndex, int size, String sortField, String sortOrder)
        {
            SearchRequest<Torrent> searchRequest;

            if (sortField != null)
            {
                Utilitary.ParseSortField(ref sortField);

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

            var searchResponse = client.Search<Torrent>(searchRequest);

            return ConvertToTorrent(searchResponse);
        }

        /// <summary>
        /// Main searching function used in many searches
        /// </summary>
        public IEnumerable<Torrent> SearchTorrents(String field, String value, int startIndex, int size, String sortField, String sortOrder)
        {
            SearchRequest<Torrent> searchRequest;

            if (sortField != null)
            {
                Utilitary.ParseSortField(ref sortField);

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

            var searchResponse = client.Search<Torrent>(searchRequest);

            return ConvertToTorrent(searchResponse);
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

            var searchResponse = client.Count<Torrent>(searchRequest);
            return searchResponse.Count;
        }

        public long GetTorrentsTotalNumber()
        {
            var result = client.Count<Torrent>(c => c
                .Index("torrent")
                .Type("doc")
            );
            return result.Count;
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

            var result = client.Search<Torrent>(request);

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

            var result = client.Search<Torrent>(request);

            var aggs = result.Aggregations.Terms("my_terms_agg");
            if (aggs == null)
                return null;

            foreach (var bucket in aggs.Buckets)
            {
                categories.Add(bucket.Key, bucket.DocCount.Value);
            }

            return categories;
        }

        public IEnumerable<Torrent> ConvertToTorrent(ISearchResponse<Torrent> response)
        {
            var torrents = response.Hits.Select(hit =>
            {
                var result = hit.Source;
                result.ID = hit.Id;
                return result;
            });

            return torrents;
        }
    }
}
