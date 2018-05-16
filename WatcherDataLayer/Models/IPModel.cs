using System;
using System.Collections.Generic;
using System.Text;

namespace WatcherDataLayer.Models
{
    public class IPModel
    {
        public String Date { get; set; }
        public String IP;
        public int Port;
        public GeoIP geoip;

        public class GeoIP
        {
            public String city_name;
            public String continent_name;
            public String country_iso_code;
            public Location location;
            public String region_name;
        }

        public class Location
        {
            public double lat;
            public double lon;
        }
    }
}
