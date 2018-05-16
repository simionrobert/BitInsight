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
        private ElasticClient client;
        private MetadataIndex torrentIndexer;
        private IPIndex ipIndexer;
        private RelationIndex relationIndexer;

        public ElasticSearchDB(String connection)
        {
            ConnectionSettings settings = new ConnectionSettings(new Uri(connection))
                .DefaultIndex("torrent");

            client = new ElasticClient(settings);
            torrentIndexer = new MetadataIndex(client);
            ipIndexer = new IPIndex(client);
            relationIndexer = new RelationIndex(client);
        }

        /// <summary>
        /// (Search Controller) Delegating function responsible for getting torrents for table 
        /// </summary>
        public IEnumerable<Torrent> GetTorrents(int startIndex, int size, String sortField, String sortOrder)
        {
            Utilitary.ParseSortField(ref sortField);

            if (sortField != null)
                return torrentIndexer.GetAllTorrents(startIndex, size, sortField, sortOrder);
            else
                return torrentIndexer.GetAllTorrents(startIndex, size, "Date", "desc"); //default
        }
        public IEnumerable<Torrent> SearchTorrentsByName(String value, int startIndex, int size, String sortField, String sortOrder)
        {
            return torrentIndexer.SearchTorrents("Search", value, startIndex, size, sortField, sortOrder);
        }

        /// <summary>
        /// (Browse Controller) Delegating function for category retrieval 
        /// </summary>
        public IEnumerable<Torrent> GetTorrentsByCategory(String type, int startIndex, int size, String sortField, String sortOrder)
        {
            return torrentIndexer.SearchTorrents("Type", type, startIndex, size, sortField, sortOrder);
        }
        public IEnumerable<Torrent> GetTorrentsByTags(String type, int startIndex, int size, String sortField, String sortOrder)
        {
            return torrentIndexer.SearchTorrents("Categories", type, startIndex, size, sortField, sortOrder);
        }

        /// <summary>
        /// (IP Controller) Delegating function responsible for getting torrents for table 
        /// </summary>
        public IEnumerable<Torrent> GetTorrentsOfIP(String ip, int startIndex, int size, String sortField, String sortOrder)
        {
            List<String> listInfohash = relationIndexer.GetTorrentsByIP(ip);

            return torrentIndexer.GetTorrentsByListIDs(listInfohash, startIndex, size, sortField, sortOrder);
        }
        public IPModel GetIP(String ip)
        {
            return ipIndexer.GetIP(ip);
        }
        public List<String> GetTorrentsOfIP(String ip)
        {
            return relationIndexer.GetTorrentsByIP(ip);
        }

        /// <summary>
        /// (Detail Controller)
        /// </summary>
        public Torrent GetTorrentByID(String id)
        {
            return torrentIndexer.GetTorrentByID(id);
        }
        public RelationModel GetIPsOfTorrent(String id)
        {
            return relationIndexer.GetIPsByTorrent(id);
        }

        /// <summary>
        /// (Statistics Controller) Crawler Statistics
        /// </summary>
        /// <returns></returns>
        public Dictionary<String, long> GetIPTorrentDistribution()
        {
            return relationIndexer.GetIPTorrentDistribution();
        }
        public long GetTorrentsNumberWithDescription()
        {
            return torrentIndexer.GetTorrentsNumberWithDesc();
        }
        public long GetTorrentsTotalNumber()
        {
            return torrentIndexer.GetTorrentsTotalNumber();
        }
        public long GetTorrentsNumberWithIP()
        {
            return relationIndexer.GetTorrentsNumberWithIP();
        }
        public Dictionary<String, long> GetTorrentPeerCountByCategory()
        {
            return torrentIndexer.GetTorrentPeerCountByCategory();
        }
        public Dictionary<String, long> GetTorrentCountByCategory()
        {
            return torrentIndexer.GetTorrentCountByCategory();
        }


        /// <summary>
        /// (Statistics Controller) World Statistics
        /// </summary>
        /// <returns></returns>
        public Dictionary<String, long> GetTopCountries()
        {
            return ipIndexer.GetTop("geoip.country_iso_code");
        }
        public Dictionary<String, long> GetTopCities()
        {
            return ipIndexer.GetTop("geoip.city_name");
        }
        public Dictionary<String, long> GetTopContinents()
        {
            return ipIndexer.GetTop("geoip.continent_name");
        }
        public Dictionary<String, long> GetTopCities(String country)
        {
            return ipIndexer.GetTopCities(country);
        }
    }
}
