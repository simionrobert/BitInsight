using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Watcher.Models.Search;

namespace Watcher.Models
{
    public class TorrentIndexModel
    {
        public IEnumerable<TorrentIndexListingModel> models { get; set; }
    }
}
