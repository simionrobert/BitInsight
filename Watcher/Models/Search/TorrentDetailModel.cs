using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WatcherDataLayer.Models;

namespace Watcher.Models.Search
{
    public class TorrentDetailModel
    {
        public String ID { get; set; }
        public String Name { get; set; }
        public DateTime Date { get; set; }
        public String Type;
        public String Categories;
        public String MagnetLink;
        public String Size;
        public int NrFiles;
        public int PeerNumber;
        public IEnumerable<IPIndexListingModel> IPs { get; set; }
        public IEnumerable<FileDetailModel> Files { get; set; }
    }
}
