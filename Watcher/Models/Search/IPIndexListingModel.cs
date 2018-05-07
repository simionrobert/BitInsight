using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Watcher.Models.Search
{
    public class IPIndexListingModel
    {
        public String ID { get; set; }
        public IEnumerable<String> IPs { get; set; }
        public String Date { get; set; }
    }
}
