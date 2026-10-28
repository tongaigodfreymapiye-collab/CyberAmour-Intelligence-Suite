import unittest

from soc_detection import analyse_log_lines, parse_log_line


class SocDetectionTests(unittest.TestCase):
    def test_repeated_failed_login_is_detected_with_evidence(self):
        lines = [
            f"Oct 28 10:21:{i:02d} host sshd[123]: Failed password for admin from 185.220.101.45 port 22"
            for i in range(6)
        ]
        result = analyse_log_lines(lines, suspicious_ips=set())
        self.assertEqual(result["findings_count"], 1)
        finding = result["findings"][0]
        self.assertEqual(finding["rule_id"], "CA-AUTH-001")
        self.assertEqual(finding["technique_ids"], ["T1110"])
        self.assertEqual(len(finding["evidence"]), 5)

    def test_below_threshold_is_not_alerted(self):
        lines = [
            f"Oct 28 10:21:{i:02d} host sshd[123]: Failed password for admin from 185.220.101.45 port 22"
            for i in range(5)
        ]
        self.assertEqual(analyse_log_lines(lines, suspicious_ips=set())["findings_count"], 0)

    def test_private_ip_is_not_treated_as_external_source_ip(self):
        row = parse_log_line("Failed password for admin from 192.168.1.10 port 22")
        self.assertIsNone(row["ip"])

    def test_port_scan_requires_distinct_ports_and_connection_evidence(self):
        lines = [f"firewall deny src=185.220.101.45 dport={port}" for port in range(20, 30)]
        result = analyse_log_lines(lines, suspicious_ips=set())
        finding = next(item for item in result["findings"] if item["rule_id"] == "CA-NET-001")
        self.assertEqual(finding["event_count"], 10)
        self.assertEqual(finding["technique_ids"], ["T1046"])

    def test_no_response_actions_are_performed(self):
        result = analyse_log_lines(["ordinary application log line"], suspicious_ips=set())
        self.assertIn("No blocking", result["limitations"][-1])


if __name__ == "__main__":
    unittest.main()
