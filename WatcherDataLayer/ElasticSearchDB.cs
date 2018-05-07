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
                .DefaultIndex("torrent")
                .DisableDirectStreaming()
                .OnRequestCompleted(apiCallDetails =>
                {
                    // log out the request and the request body, if one exists for the type of request
                    if (apiCallDetails.RequestBodyInBytes != null)
                    {
                        Console.WriteLine($"{apiCallDetails.HttpMethod} {apiCallDetails.Uri} " +
                            $"{Encoding.UTF8.GetString(apiCallDetails.RequestBodyInBytes)}");
                        list.Add(
                            $"{apiCallDetails.HttpMethod} {apiCallDetails.Uri} " +
                            $"{Encoding.UTF8.GetString(apiCallDetails.RequestBodyInBytes)}");
                    }
                    else
                    {
                        Console.WriteLine($"{apiCallDetails.HttpMethod} {apiCallDetails.Uri}");
                        list.Add($"{apiCallDetails.HttpMethod} {apiCallDetails.Uri}");
                    }

                    // log out the response and the response body, if one exists for the type of response
                    if (apiCallDetails.ResponseBodyInBytes != null)
                    {
                        Console.WriteLine($"Status: {apiCallDetails.HttpStatusCode}" +
                                 $"{Encoding.UTF8.GetString(apiCallDetails.ResponseBodyInBytes)}");
                        list.Add($"Status: {apiCallDetails.HttpStatusCode}" +
                                 $"{Encoding.UTF8.GetString(apiCallDetails.ResponseBodyInBytes)}");
                    }
                    else
                    {
                        Console.WriteLine($"Status: {apiCallDetails.HttpStatusCode}");
                        list.Add($"Status: {apiCallDetails.HttpStatusCode}");
                    }
                });
          

            _client = new ElasticClient(settings);
        }

        public IEnumerable<Torrent> GetTorrents(int startIndex, int size, String sortField, String sortOrder)
        {
            switch (sortField)
            {
                case "type":
                    return GetAllTorrents(startIndex, size, "Type.keyword", sortOrder);
                case "name":
                    return GetAllTorrents(startIndex,  size, "Name.keyword", sortOrder);
                case "date":
                    return GetAllTorrents(startIndex, size, "Date", sortOrder);
                case "size":
                    return GetAllTorrents(startIndex, size, "Size", sortOrder);
                case "peerNumber":
                    return GetAllTorrentsSortedByPeers(startIndex, size, sortOrder);
                default:
                    return GetAllTorrents(startIndex, size, "Date","desc");
            }
        }

        public IEnumerable<Torrent> SearchTorrentsByName(String name, int startIndex, int size, String sortField, String sortOrder)
        {
            SearchRequest<Torrent> searchRequest;

            if (sortField != null)
            {
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

        public IEnumerable<Torrent> GetTorrentsByCategory(String type)
        {
            throw new NotImplementedException();
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

        private IEnumerable<Torrent> GetAllTorrentsSortedByPeers(int startIndex, int size, String sortOrder)
        {
            //TODO: Implement sorted peers
            return GetAllTorrents(startIndex, size, "", sortOrder);
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

            var ips = Converter.ConvertToIP(searchResponse);

            return ips;
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
            // TODO: Implement By IP
            var searchResponse = _client.Search<SetIPs>(s => s
             .Index("ip")
             .Type("doc")
             .StoredFields(sf => sf
                .Fields(
                    f => f.ID
                )
             )
              .Query(q => q
                     .Match(m => m
                        .Field(f => f.IPs)
                        .Query(ip)
                     )
              )
            );

            var ips = searchResponse.Fields;

            //TODO: Get torrents with these ids
            throw new NotImplementedException();
        }

        public int GetTorrentCountByCategory(String category)
        {
            //TODO: Implement this
            return 5;
            throw new NotImplementedException();
        }

        public int GetTorrentPeerCountByCategory(String category)
        {
            return 10;
            //TODO: Implement this
            throw new NotImplementedException();
        }

        public String[] GetAllCategories()
        {
            //TODO: Implement this
            return new String[] { "a", "b", "c" };
            throw new NotImplementedException();
        }
    }
}
