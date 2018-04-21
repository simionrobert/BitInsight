using Nest;
using System;
using System.Collections.Generic;
using System.Text;
using WatcherDataLayer.Models;
using System.Linq;

namespace WatcherDataLayer
{
    public class ESContext
    {
        private List<String> list = new List<string>();
        private ElasticClient _client;

        public ESContext(String connection)
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

        public IEnumerable<Torrent> GetAllTorrents()
        {
            var searchResponse = _client.Search<Torrent>(s => s
                .Index("torrent")
                .Type("doc")
                 .Query(q => q
                     .MatchAll()
                 )
             );

            var torrents = convertToTorrent(searchResponse);

            return torrents;
        }

        public IEnumerable<Torrent> GetAllTorrentsSortedDate()
        {
            //TODO: Implement sorted date
            var searchResponse = _client.Search<Torrent>(s => s
                .Index("torrent")
                .Type("doc")
                 .Query(q => q
                     .MatchAll()
                 )
             );

            var torrents = convertToTorrent(searchResponse);

            return torrents;
        }

        public IEnumerable<Torrent> GetTorrentsByCategory(String type)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<Torrent> GetAllTorrentsSortedPeers()
        {
            //TODO: Implement sorted peers
            var searchResponse = _client.Search<Torrent>(s => s
                .Index("torrent")
                .Type("doc")
                 .Query(q => q
                     .MatchAll()
                 )
             );

            var torrents = convertToTorrent(searchResponse);

            return torrents;
        }

        public IEnumerable<Torrent> GetTorrentsByName(String name)
        {
            //TODO:Implement search
            var searchResponse = _client.Search<Torrent>(s => s
                .Index("torrent")
                .Type("doc")
                .Query(q => q
                .Match(m => m
                    .Field(f => f.Search)
                    .Query(name)
                    )
                )
             );

            var torrents = convertToTorrent(searchResponse);


            return torrents;
        }

        public Torrent GetTorrentByID(String id)
        {
            var searchResponse = _client.Get<Torrent>(id, idx => idx.Index("torrent").Type("doc"));

            var torrent = searchResponse.Source;
            torrent.ID = searchResponse.Id;

            return torrent;
        }

        public IEnumerable<IP> getAllIPs()
        {
            var searchResponse = _client.Search<IP>(s => s
                .Index("ip")
                .Type("doc")
                 .Query(q => q
                     .MatchAll()
                 )
             );

            var ips = convertToIP(searchResponse);

            return ips;
        }

        public IEnumerable<IP> getIPsByTorrent(String id)
        {
            var searchResponse = _client.Get<IP>(id, idx => idx.Index("ip").Type("doc"));

            var ips = searchResponse.Source.IPs.Select(hit =>
            {
                var result = searchResponse.Source;
                result.ID = searchResponse.Id;
                return result;
            });

            return ips;
        }

        public IEnumerable<Torrent> getTorrentsByIP(String ip)
        {
            var searchResponse = _client.Search<IP>(s => s
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

        private IEnumerable<Torrent> convertToTorrent(ISearchResponse<Torrent> response)
        {
            var torrents = response.Hits.Select(hit =>
            {
                var result = hit.Source;
                result.ID = hit.Id;
                return result;
            });

            return torrents;
        }

        private IEnumerable<IP> convertToIP(ISearchResponse<IP> response)
        {
            var ips = response.Hits.Select(hit =>
            {
                var result = hit.Source;
                result.ID = hit.Id;
                return result;
            });

            return ips;
        }
    }
}
