import React from 'react';
import { BookOpen, AlertTriangle, TrendingUp, BarChart2, CheckCircle2, DollarSign } from 'lucide-react';

export default function UserGuide({ onNavigate }) {
    return (
        <div className="fade-in max-w-4xl mx-auto pb-12">
            <div className="glass-panel p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/20 rounded-xl text-primary">
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient">คู่มือการใช้งาน ThaiFin</h1>
                        <p className="text-muted mt-1">สำหรับนักลงทุนมือใหม่ (Beginner's Guide)</p>
                    </div>
                </div>
                <p className="text-white/80 leading-relaxed">
                    ยินดีต้อนรับสู่ <strong>ThaiFin</strong> เครื่องมือวิเคราะห์ข้อมูลพื้นฐานหุ้นไทยที่ออกแบบมาเพื่อให้นักลงทุนทุกระดับเข้าถึงข้อมูลเชิงลึกได้ง่ายและรวดเร็ว คู่มือนี้จะช่วยให้คุณเข้าใจการใช้งานแต่ละหน้าต่างของระบบ วิธีการอ่านค่าตัวชี้วัดทางการเงินเชิงลึก และข้อควรระวังสำคัญ!
                </p>
            </div>

            <div className="space-y-8">
                {/* Section 1 */}
                <section className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <BarChart2 className="text-blue-400" />
                        <h2 className="text-xl font-bold">1. ภาพรวมตลาดและข้อมูลหุ้นรายตัว (Dashboard)</h2>
                    </div>

                    <div className="space-y-6 text-white/80">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2 text-primary">📈 กราฟแนวโน้มงบการเงิน 10 ปี</h3>
                            <p className="mb-2">แสดงทิศทางของ "รายได้รวม (Revenue)" และ "กำไรสุทธิ (Net Profit)"</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted">
                                <li><strong>วิธีอ่าน:</strong> ให้ดูว่าบริษัทมีแนวโน้มรายได้และกำไรเติบโตขึ้นเรื่อยๆ หรือไม่ กราฟที่ชันขึ้นแสดงถึงการเติบโตที่ดี หากกราฟสวิงขึ้นลงรุนแรงหรือดิ่งลง แสดงว่าธุรกิจมีความผันผวนหรือกำลังถดถอย</li>
                                <li><span className="text-red-400">ข้อควรระวัง:</span> กำไรสุทธิที่พุ่งสูงปรี๊ดในปีใดปีหนึ่ง อาจเกิดจาก "กำไรพิเศษ" (เช่น ขายที่ดิน ขายโรงงาน) ไม่ใช่กำไรจากการดำเนินงานปกติ ต้องตรวจสอบเพิ่มเติม</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2 text-primary">📋 ดัชนีชี้วัดทางการเงินเชิงลึก 38 รายการ</h3>
                            <p className="mb-4 text-sm text-muted">แบ่งเป็น 4 หมวดหมู่หลัก เพื่อประเมินความแข็งแกร่งของบริษัท (ตัวเลข M = หลักล้านบาท, B = พันล้านบาท)</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <h4 className="font-bold text-blue-300 mb-2">🟢 ความสามารถในการทำกำไร (Profitability)</h4>
                                    <ul className="list-disc pl-4 text-sm space-y-2">
                                        <li><strong>Gross/Net Profit:</strong> ยิ่งสูงยิ่งดี</li>
                                        <li><strong>YoY / QoQ (%):</strong> เติบโตเทียบปีก่อน/ไตรมาสก่อน (ควรเป็นบวก)</li>
                                        <li><strong>Margins (%):</strong> อัตรากำไร ยิ่งสูงแสดงว่าควบคุมต้นทุนได้เก่ง</li>
                                        <li><strong>SGA:</strong> ค่าใช้จ่ายบริหาร <span className="text-red-400">ยิ่งสัดส่วนเทียบรายได้ต่ำ ยิ่งดี</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <h4 className="font-bold text-purple-300 mb-2">🔵 งบดุลและความแข็งแกร่ง (Health)</h4>
                                    <ul className="list-disc pl-4 text-sm space-y-2">
                                        <li><strong>Total Assets/Equity:</strong> ขนาดธุรกิจ ยิ่งสูงยิ่งมั่นคง</li>
                                        <li><strong>Debt to Equity (D/E):</strong> หนี้ต่อทุน <span className="text-red-400">ไม่ควรเกิน 2 เท่า ยิ่งต่ำยิ่งปลอดภัย</span></li>
                                        <li><strong>ROA / ROE (%):</strong> ผลตอบแทนต่อสินทรัพย์/ทุน <span className="text-success">ควรมากกว่า 10-15% อย่างสม่ำเสมอ</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <h4 className="font-bold text-yellow-300 mb-2">🟡 กระแสเงินสด (Cash Flow)</h4>
                                    <ul className="list-disc pl-4 text-sm space-y-2">
                                        <li><strong>Operating CF:</strong> เงินสดจากการดำเนินงาน <span className="text-success">ทิศทางต้องเป็นบวก (สำคัญมาก!)</span></li>
                                        <li><strong>Investing CF:</strong> มักจะติดลบ แปลว่าเอาเงินไปลงทุนขยายกิจการ</li>
                                        <li><strong>Cash Cycle:</strong> วงจรเงินสด <span className="text-success">ยิ่งสั้น (ค่าน้อยๆ หรือติดลบ) ยิ่งดี</span></li>
                                    </ul>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg">
                                    <h4 className="font-bold text-green-300 mb-2">🟣 การประเมินมูลค่า (Valuation)</h4>
                                    <ul className="list-disc pl-4 text-sm space-y-2">
                                        <li><strong>P/E Ratio:</strong> จุดคุ้มทุน (กี่ปี) <span className="text-success">ยิ่งต่ำยิ่งดี (ซื้อของถูก)</span> แต่อย่าต่ำเพราะจะเจ๊ง</li>
                                        <li><strong>P/B Ratio:</strong> ราคาหุ้นเทียบมูลค่าบัญชี ต่ำกว่า 1 คือถูกมาก</li>
                                        <li><strong>Dividend Yield:</strong> เปอร์เซ็นต์ปันผล <span className="text-success">ยิ่งสูงยิ่งดี</span> แต่ระวังปันผลหลอกตาจากกำไรพิเศษ</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2 */}
                <section className="glass-panel p-6">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <CheckCircle2 className="text-green-400" />
                        <h2 className="text-xl font-bold">2. ศูนย์วิเคราะห์ข้อมูลเชิงลึก (Analysis Hub)</h2>
                    </div>
                    <div className="space-y-4 text-white/80">
                        <p>สูตรลัดที่ดึงข้อมูล 38 ตัวมาสรุปเป็น Use Cases พร้อมใช้:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="border border-white/5 bg-white/5 p-4 rounded-xl">
                                <h3 className="font-bold text-gradient-primary mb-1">🏥 Financial Health</h3>
                                <p className="text-sm text-muted">เช็คหุ้นรายตัวอย่างรวดเร็ว ว่าพื้นฐานแข็งแกร่ง กำไรดี และมูลค่าตอนนี้น่าเข้าซื้อหรือไม่ (ใช้ด่านสุดท้ายก่อนกดซื้อ)</p>
                            </div>
                            <div className="border border-white/5 bg-white/5 p-4 rounded-xl">
                                <h3 className="font-bold text-gradient-accent mb-1">🏆 Sector Rankings</h3>
                                <p className="text-sm text-muted">หาสุดยอดอุตสาหกรรมแชมป์ทำกำไรของปีนี้ โดยเรียงจากค่าเฉลี่ย ROE</p>
                            </div>
                            <div className="border border-white/5 bg-white/5 p-4 rounded-xl">
                                <h3 className="font-bold text-success mb-1">💰 Dividend Hunters</h3>
                                <p className="text-sm text-muted">สแกนหาหุ้นปันผลเดือดที่ให้ % สูงกว่ามาตรฐานที่คุณตั้งไว้ (ระวัง: ต้องดู P/E ประกอบเสมอ)</p>
                            </div>
                            <div className="border border-white/5 bg-white/5 p-4 rounded-xl">
                                <h3 className="font-bold text-blue-400 mb-1">🚀 Growth Screen</h3>
                                <p className="text-sm text-muted">หานักเตะดาวรุ่งที่รายได้และกำไรเติบโตระเบิด (QoQ/YoY สูง) แลกมาด้วย P/E ที่มักจะแพงตามความคาดหวัง</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3 - Precautions */}
                <section className="border border-red-500/30 bg-red-500/5 p-6 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
                    <div className="flex items-center gap-3 mb-6 border-b border-red-500/20 pb-4">
                        <AlertTriangle className="text-red-400" />
                        <h2 className="text-xl font-bold text-red-100">ข้อควรระวังขั้นสุดยอด! (Trader Precautions)</h2>
                    </div>
                    <div className="space-y-4 text-white/80 text-sm">
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="font-bold text-red-300 mb-1">1. งบการเงินคือภาพในอดีต (Lagging Indicator)</h4>
                            <p className="text-muted">ตลาดหุ้นสนใจ "อนาคต" หากคุณเจอหุ้น P/E ถูกมาก, ปันผลสูงมาก ให้ตั้งข้อสงสัยไว้ก่อนว่า "อนาคตธุรกิจกำลังจะแย่ลงหรือเปล่า?" อย่าเชื่อแค่ตัวเลข ให้วิเคราะห์แนวโน้มธุรกิจประกอบเสมอ</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="font-bold text-red-300 mb-1">2. ระวังกำไรพิเศษ (One-time Gain/Loss)</h4>
                            <p className="text-muted">P/E ต่ำ ปันผลสูง อาจเกิดจากการขายสมบัติกินในปีนั้น ไม่ใช่กำไรจากกิจการหลัก <strong className="text-white">วิธีแก้:</strong> ให้เจาะดู <em>Operating CF (กระแสเงินสดดำเนินงาน)</em> ควบคู่เสมอ</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="font-bold text-red-300 mb-1">3. อย่าดูตัวชี้วัดตัวเดียวโดดๆ</h4>
                            <p className="text-muted">ROE สูง เป็นเรื่องดี แต่ถ้าระบบแสดง D/E สูงปรี๊ดตาม แปลว่าบริษัทกู้หนี้ยืมสินมาปั่น ROE ซึ่งมีความเสี่ยงสูงที่จะล้มละลายยามวิกฤต <strong className="text-white">สูตรจำ:</strong> เช็คกำไร + เช็คความมั่นคงการเงิน ควบคู่กัน</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded-lg">
                            <h4 className="font-bold text-red-300 mb-1">4. เทียบข้อมูลข้ามสายพันธุ์ไม่ได้!</h4>
                            <p className="text-muted">กลุ่มค้าปลีก (เช่น 7-11) วงจรเงินสดติดลบ(เก็บเงินลูกค้าก่อน จ่ายซัพพลายเออร์ทีหลัง) เป็นเรื่องสุดยอด... แต่ถ้าบริษัทก่อสร้างวงจรแบบเดียวกันและหนี้สูง แปลว่าใกล้เจ๊ง <strong className="text-white">จงเทียบตัวเลขเฉพาะกิจการใน Sector เดียวกันเท่านั้น</strong></p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
